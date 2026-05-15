import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const PENDING_TIMEOUT_MINUTES = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items to reserve" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    try {
      // Clean up ALL expired reservations (not just this user's)
      await adminClient.rpc("cleanup_expired_reservations")
    } catch (cleanupError) {
      console.warn("Expired reservation cleanup failed:", cleanupError)
    }

    // Cleanup PENDING orders older than timeout (huérfanas sin respuesta Wompi)
    try {
      const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

      const { data: pendingOrders } = await adminClient
        .from("orders")
        .select("id")
        .eq("status", "PENDING")
        .lt("created_at", cutoffTime)

      if (pendingOrders && pendingOrders.length > 0) {
        console.log(`[CLEANUP] Found ${pendingOrders.length} PENDING orders to timeout`)

        for (const order of pendingOrders) {
          // Get items
          const { data: orderItems } = await adminClient
            .from("order_items")
            .select("product_id, variant_id, quantity")
            .eq("order_id", order.id)

          // Rollback stock
          for (const item of orderItems ?? []) {
            if (item.variant_id) {
              await adminClient.rpc("increment_sku_stock", {
                p_sku_id: item.variant_id,
                p_quantity: item.quantity,
              })
            } else {
              await adminClient.rpc("increment_product_stock", {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              })
            }
          }

          // Mark as ERROR
          await adminClient
            .from("orders")
            .update({ status: "ERROR" })
            .eq("id", order.id)
            .eq("status", "PENDING")
        }

        console.log(`[CLEANUP] Processed ${pendingOrders.length} PENDING orders`)
      }
    } catch (pendingError) {
      console.warn("Pending orders cleanup failed:", pendingError)
    }

    const { data, error } = await adminClient.rpc("create_stock_reservation", {
      p_user_id: user.id,
      p_items: JSON.stringify(items),
      p_reservation_minutes: 15,
    })

    if (error) {
      console.error("Reserve stock error:", error)
      return NextResponse.json({ error: "Failed to reserve stock" }, { status: 500 })
    }

    return NextResponse.json({ reservation_id: data })
  } catch (error) {
    console.error("Reserve stock error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}