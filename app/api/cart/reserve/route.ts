import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

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