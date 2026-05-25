import { NextResponse } from "next/server"
import { runCleanup } from "@/features/cart/services/cleanupService"

export const runtime = "edge"

export async function POST() {
  try {
    const results = await runCleanup()

    return NextResponse.json({
      success: true,
      reservations_cleaned: results.reservations_cleaned,
      pending_orders_processed: results.pending_orders_processed,
      pending_orders_errors: results.pending_orders_errors,
      message: `Reservations cleaned: ${results.reservations_cleaned}, Pending orders processed: ${results.pending_orders_processed}`,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST only. Cleans expired reservations and PENDING orders older than 30 minutes.",
  })
}