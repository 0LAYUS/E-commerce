import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { PosSaleFilters } from "@/features/pos/repositories/posRepository"
import { getSalesAdmin } from "@/features/pos/services/posSaleService"

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