import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const PENDING_TIMEOUT_MINUTES = 30

export async function POST() {
  try {
    const supabase = await createAdminClient()
    const results: {
      reservations_cleaned: number
      pending_orders_processed: number
      pending_orders_errors: number
    } = {
      reservations_cleaned: 0,
      pending_orders_processed: 0,
      pending_orders_errors: 0,
    }

    // 1. Cleanup expired reservations (existing logic)
    const { data: cleaned, error: cleanupError } = await supabase.rpc("cleanup_expired_reservations")
    if (cleanupError) {
      console.error("Reservation cleanup error:", cleanupError)
      return NextResponse.json({ error: "Reservation cleanup failed" }, { status: 500 })
    }
    results.reservations_cleaned = cleaned ?? 0

    // 2. Cleanup PENDING orders older than 30 minutes (new logic)
    const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

    // Get PENDING orders older than timeout
    const { data: pendingOrders, error: pendingError } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "PENDING")
      .lt("created_at", cutoffTime)

    if (pendingError) {
      console.error("Pending orders query error:", pendingError)
      // Don't fail the whole request if this part fails
    } else if (pendingOrders && pendingOrders.length > 0) {
      console.log(`[CRON] Found ${pendingOrders.length} PENDING orders to timeout`)

      for (const order of pendingOrders) {
        try {
          // Get order items
          const { data: orderItems, error: itemsError } = await supabase
            .from("order_items")
            .select("product_id, variant_id, quantity")
            .eq("order_id", order.id)

          if (itemsError) {
            console.error(`[CRON] Error fetching items for order ${order.id}:`, itemsError)
            results.pending_orders_errors++
            continue
          }

          // Rollback stock for each item
          for (const item of orderItems ?? []) {
            if (item.variant_id) {
              await supabase.rpc("increment_sku_stock", {
                p_sku_id: item.variant_id,
                p_quantity: item.quantity,
              })
            } else {
              await supabase.rpc("increment_product_stock", {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              })
            }
          }

          // Mark as ERROR
          const { error: updateError } = await supabase
            .from("orders")
            .update({ status: "ERROR" })
            .eq("id", order.id)
            .eq("status", "PENDING") // Guard against race conditions

          if (updateError) {
            console.error(`[CRON] Error marking order ${order.id} as ERROR:`, updateError)
            results.pending_orders_errors++
          } else {
            console.log(`[CRON] Order ${order.id} marked as ERROR, stock restored`)
            results.pending_orders_processed++
          }
        } catch (err) {
          console.error(`[CRON] Error processing order ${order.id}:`, err)
          results.pending_orders_errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      reservations_cleaned: results.reservations_cleaned,
      pending_orders_processed: results.pending_orders_processed,
      pending_orders_errors: results.pending_orders_errors,
      message: `Reservations cleaned: ${results.reservations_cleaned}, Pending orders processed: ${results.pending_orders_processed}`,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST only. Cleans expired reservations and PENDING orders older than 30 minutes.",
  })
}