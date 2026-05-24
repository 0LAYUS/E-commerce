import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shipping_zones")
    .select("id, name, cost, free_threshold")
    .eq("active", true)
    .order("position", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ zones: data })
}