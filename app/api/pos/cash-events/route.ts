import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getCashEvents } from "@/features/pos/services/posCashEventService"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "administrador") throw new Error("Forbidden")
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const userId = searchParams.get("user_id")

    const events = await getCashEvents({ from, to, userId })

    return NextResponse.json({ events })
  } catch (error) {
    const message = (error as Error).message
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("POS cash events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}