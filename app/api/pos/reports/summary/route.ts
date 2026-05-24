import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getReportsSummary } from "@/features/pos/services/posSaleService"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const summary = await getReportsSummary(user.id, from, to)

    return NextResponse.json(summary)
  } catch (error) {
    const message = (error as Error).message
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("POS summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}