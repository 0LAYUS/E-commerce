import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type SaleRow = {
  total: number | string | null
  payment_method: string | null
  amount_received: number | string | null
  change_amount: number | string | null
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
      .from("pos_sales")
      .select("total, payment_method, amount_received, change_amount, created_at")

    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }

    const { data: sales, error } = await query

    if (error) {
      console.error("POS summary error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const salesData = sales || []

    const totalSales = salesData.length
    const totalAmount = salesData.reduce((sum: number, s: SaleRow) => sum + Number(s.total), 0)
    const avgTicket = totalSales > 0 ? totalAmount / totalSales : 0

    const byPaymentMethod: Record<string, { count: number; amount: number }> = {
      efectivo: { count: 0, amount: 0 },
      tarjeta: { count: 0, amount: 0 },
      transferencia: { count: 0, amount: 0 },
      mixto: { count: 0, amount: 0 },
    }

    salesData.forEach((sale: SaleRow) => {
      const method = sale.payment_method || "mixto"
      if (byPaymentMethod[method]) {
        byPaymentMethod[method].count++
        byPaymentMethod[method].amount += Number(sale.total)
      }
    })

    const efectivoCashIn = salesData
      .filter((s: SaleRow) => s.payment_method === "efectivo")
      .reduce((sum: number, s: SaleRow) => {
        const received = Number(s.amount_received) || 0
        const change = Number(s.change_amount) || 0
        return sum + received - change
      }, 0)

    return NextResponse.json({
      total_sales: totalSales,
      total_amount: totalAmount,
      avg_ticket: avgTicket,
      by_payment_method: byPaymentMethod,
      efectivo_cash_in: efectivoCashIn,
    })
  } catch (error) {
    console.error("POS summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
