import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { PosSaleFilters } from "@/features/pos/repositories/posRepository"
import { getSalesAdmin, createSale, CreateSaleBody } from "@/features/pos/services/posSaleService"
import { validatePosItems } from "@/features/pos/services/posValidateService"

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateSaleBody = await request.json()

    const validationItems = body.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
    }))

    const validation = await validatePosItems(validationItems)

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Stock validation failed", items: validation.items },
        { status: 400 }
      )
    }

    const result = await createSale(user.id, body)
    return NextResponse.json({ sale: result.sale })
  } catch (error) {
    console.error("POS create sale error:", error)
    const message = (error as Error).message
    if (message === "Stock insuficiente") {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}