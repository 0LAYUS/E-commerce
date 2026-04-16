import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const userId = searchParams.get("user_id")

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
      .order("created_at", { ascending: false })
      .limit(100)

    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }
    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: events, error } = await query

    if (error) {
      console.error("POS cash events fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error("POS cash events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
