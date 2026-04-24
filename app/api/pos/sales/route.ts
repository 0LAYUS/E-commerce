import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

type SaleItem = {
  product_id: string
  variant_id?: string
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  discount_pct: number
  subtotal: number
}

type SalePayment = {
  method: string
  amount: number
}

type CreateSaleBody = {
  customer_name?: string
  items: SaleItem[]
  discount_amount: number
  discount_reason?: string
  subtotal: number
  total: number
  payment_method: string
  amount_received?: number
  change_amount?: number
  payments?: SalePayment[]
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSaleBody = await request.json()

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      customer_name,
      items,
      discount_amount,
      discount_reason,
      subtotal,
      total,
      payment_method,
      amount_received,
      change_amount,
      payments,
      notes,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const itemsJson = JSON.stringify(items)

    const { data: sale, error: saleError } = await adminClient
      .from("pos_sales")
      .insert([{
        seller_id: user.id,
        customer_name: customer_name || null,
        items: itemsJson,
        subtotal,
        discount_amount: discount_amount || 0,
        discount_reason: discount_reason || null,
        total,
        payment_method,
        payment_status: "paid",
        amount_received: amount_received || null,
        change_amount: change_amount || null,
        notes: notes || null,
        channel: "pos",
      }])
      .select()
      .single()

    if (saleError || !sale) {
      console.error("POS sale error:", saleError)
      return NextResponse.json({ error: saleError?.message || "Error creating sale" }, { status: 500 })
    }

    if (payments && payments.length > 1) {
      const paymentsWithSaleId = payments.map(p => ({
        sale_id: sale.id,
        method: p.method,
        amount: p.amount,
      }))

      await adminClient.from("pos_sale_payments").insert(paymentsWithSaleId)
    }

    const { error: stockError } = await adminClient.rpc("decrement_pos_stock", {
      p_items: items, // array directo, sin JSON.stringify
    })

    if (stockError) {
      console.error("Stock decrement failed, rolling back sale", stockError)
      await adminClient.from("pos_sales").delete().eq("id", sale.id)
      return NextResponse.json({ error: "Stock insufficient" }, { status: 400 })
    }

    if (payment_method === "efectivo" && amount_received) {
      await adminClient.from("pos_cash_events").insert([{
        user_id: user.id,
        type: "sale",
        amount: amount_received,
        payment_method: "efectivo",
      }])
    }

    return NextResponse.json({ success: true, sale })
  } catch (error) {
    console.error("POS sale error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const sellerId = searchParams.get("seller_id")
    const paymentMethod = searchParams.get("payment_method")
    const limit = parseInt(searchParams.get("limit") || "50")

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
      .select(`
        id,
        seller_id,
        customer_name,
        items,
        subtotal,
        discount_amount,
        total,
        payment_method,
        payment_status,
        amount_received,
        change_amount,
        notes,
        created_at,
        seller:profiles!seller_id(id, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }
    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    }
    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod)
    }

    const { data: sales, error } = await query

    if (error) {
      console.error("POS sales fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sales: sales || [] })
  } catch (error) {
    console.error("POS sales error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
