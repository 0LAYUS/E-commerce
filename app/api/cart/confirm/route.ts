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
    const { reservation_id } = body

    if (!reservation_id) {
      return NextResponse.json({ error: "Reservation ID required" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient.rpc("confirm_stock_reservation", {
      p_reservation_id: reservation_id,
    })

    if (error) {
      console.error("Confirm reservation error:", error)
      return NextResponse.json({ error: "Failed to confirm reservation" }, { status: 500 })
    }

    return NextResponse.json({ success: data })
  } catch (error) {
    console.error("Confirm reservation error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}