import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

type CashupBody = {
  declared_amount: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CashupBody = await request.json()
    const { declared_amount, notes } = body

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todaySales } = await adminClient
      .from("pos_sales")
      .select("amount_received, change_amount")
      .eq("payment_method", "efectivo")
      .gte("created_at", today.toISOString())

    const expectedCash = todaySales?.reduce((sum: number, sale: any) => {
      const received = sale.amount_received || 0
      const change = sale.change_amount || 0
      return sum + received - change
    }, 0) || 0

    const difference = declared_amount - expectedCash

    const { data: cashup, error } = await adminClient
      .from("pos_cash_events")
      .insert([{
        user_id: user.id,
        type: "cashup",
        amount: declared_amount,
        notes: `Declarado: $${declared_amount.toLocaleString()}. Esperado: $${expectedCash.toLocaleString()}. Diferencia: $${difference.toLocaleString()}. ${notes || ""}`.trim(),
      }])
      .select()
      .single()

    if (error) {
      console.error("Cashup error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cashup,
      summary: {
        declared_amount,
        expected_amount: expectedCash,
        difference,
      },
    })
  } catch (error) {
    console.error("Cashup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let query = supabase
      .from("pos_cash_events")
      .select(`
        id,
        user_id,
        type,
        amount,
        payment_method,
        notes,
        created_at,
        user:profiles!user_id(id, email)
      `)
      .eq("type", "cashup")
      .order("created_at", { ascending: false })

    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }

    const { data: cashups, error } = await query

    if (error) {
      console.error("Cashup fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cashups: cashups || [] })
  } catch (error) {
    console.error("Cashup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
