import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name")

    if (error) {
      console.error("Categories error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("Categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
