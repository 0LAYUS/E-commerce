import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createSale, getSalesAdmin, type CreateSaleBody } from "@/features/pos/services/posSaleService"
import type { PosSaleFilters } from "@/features/pos/repositories/posRepository"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateSaleBody = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const result = await createSale(user.id, body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("POS sale error:", error)
    const message = (error as Error).message
    if (message === "Stock insuficiente") {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: PosSaleFilters = {
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      seller_id: searchParams.get("seller_id"),
      payment_method: searchParams.get("payment_method"),
      limit: parseInt(searchParams.get("limit") || "50"),
    }

    const sales = await getSalesAdmin(user.id, filters)
    return NextResponse.json({ sales })
  } catch (error) {
    console.error("POS sales error:", error)
    const message = (error as Error).message
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}