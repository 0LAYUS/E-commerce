import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { confirmReservation } from "@/features/cart/services/cartConfirmService"

export const runtime = "edge"

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

    const result = await confirmReservation(user.id, reservation_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Confirm reservation error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}