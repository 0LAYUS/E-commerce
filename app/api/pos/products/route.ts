import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getProductsForPOS } from "@/features/pos/services/posProductService"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("category_id") || ""

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const products = await getProductsForPOS(search, categoryId)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("POS products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}