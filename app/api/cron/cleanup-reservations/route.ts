import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.rpc("cleanup_expired_reservations")

    if (error) {
      console.error("Cleanup error:", error)
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      cleaned: data,
      message: `Cleaned up ${data} expired reservations` 
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST only. Call this endpoint to cleanup expired reservations." 
  })
}