import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createCashup, getCashups } from "@/features/pos/services/posSaleService"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { declared_amount, notes } = body

    if (declared_amount === undefined) {
      return NextResponse.json({ error: "declared_amount is required" }, { status: 400 })
    }

    const summary = await createCashup(user.id, declared_amount, notes)

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("Cashup error:", error)
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const cashups = await getCashups(from, to)
    return NextResponse.json({ cashups })
  } catch (error) {
    console.error("Cashup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}