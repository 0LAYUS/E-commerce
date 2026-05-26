import { NextResponse } from "next/server"
import { processWompiWebhook } from "@/features/orders/services/wompiWebhookService"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const checksumHeader = req.headers.get("x-event-checksum")

    const result = await processWompiWebhook(payload, checksumHeader)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ received: true, skipped: result.skipped })
  } catch (error) {
    console.error("[Wompi Webhook] Error interno:", error)
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 })
  }
}