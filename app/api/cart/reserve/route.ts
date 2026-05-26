import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { reserveCartStock } from "@/features/cart/services/cartReserveService"

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

    const reservationId = await reserveCartStock(user.id, items)

    return NextResponse.json({ reservation_id: reservationId })
  } catch (error) {
    console.error("Reserve stock error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}