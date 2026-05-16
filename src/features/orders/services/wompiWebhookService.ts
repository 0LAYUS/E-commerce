import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation"
import {
  findOrderItems,
  findOrderWithItemsForEmail,
} from "@/features/orders/repositories/orderRepository"
import {
  incrementSkuStock,
  incrementProductStock,
} from "@/features/cart/repositories/stockRepository"

function verifyWompiSignature(payload: unknown, checksumHeader: string | null): boolean {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET

  if (!eventsSecret || eventsSecret.startsWith("test_events_REEMPLAZAR")) {
    console.warn("[Wompi Webhook] WOMPI_EVENTS_SECRET no configurado. Omitiendo validación.")
    return true
  }

  if (!checksumHeader) {
    console.error("[Wompi Webhook] Falta el header x-event-checksum.")
    return false
  }

  const timestamp = (payload as { timestamp?: string }).timestamp
  if (!timestamp) {
    console.error("[Wompi Webhook] Falta el campo timestamp en el payload.")
    return false
  }

  const stringToHash = `${timestamp}${checksumHeader}${eventsSecret}`
  const expectedSignature = crypto.createHash("sha256").update(stringToHash).digest("hex")

  const isValid = expectedSignature === checksumHeader
  if (!isValid) {
    console.error("[Wompi Webhook] Firma inválida.")
  }
  return isValid
}

export type WompiTransactionEvent = {
  event: string
  data: {
    transaction: {
      id: string
      reference: string
      status: "APPROVED" | "DECLINED" | "ERROR" | "VOIDED"
    }
  }
  timestamp?: string
}

export async function processWompiWebhook(
  payload: WompiTransactionEvent,
  checksumHeader: string | null
): Promise<{ received: boolean; skipped?: boolean; error?: string }> {
  if (!verifyWompiSignature(payload, checksumHeader)) {
    return { received: false, error: "Firma inválida" }
  }

  const event = payload.event
  if (event !== "transaction.updated") {
    return { received: true, skipped: true }
  }

  const transaction = payload.data?.transaction
  if (!transaction) {
    return { received: false, error: "Payload malformado" }
  }

  const orderId = transaction.reference
  const newStatus = transaction.status

  const supabase = await createAdminClient()

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus, wompi_transaction_id: transaction.id })
    .eq("id", orderId)

  if (updateError) {
    console.error("[Wompi Webhook] Error actualizando orden:", updateError)
    return { received: false, error: updateError.message }
  }

  if (newStatus === "DECLINED" || newStatus === "ERROR" || newStatus === "VOIDED") {
    const items = await findOrderItems(supabase, orderId)

    for (const item of items) {
      if (item.variant_id) {
        await incrementSkuStock(supabase, item.variant_id, item.quantity)
      } else {
        await incrementProductStock(supabase, item.product_id, item.quantity)
      }
    }
  }

  if (newStatus === "APPROVED") {
    const order = await findOrderWithItemsForEmail(supabase, orderId)

    if (order && order.customer_email) {
      const items = (order.order_items || []).map((item: unknown) => {
        const i = item as {
          products?: { name: string }
          quantity: number
          price_at_purchase: number
          product_skus?: { sku_code: string | null }
        }
        return {
          name: i.products?.name || "Producto",
          quantity: i.quantity,
          price_at_purchase: i.price_at_purchase,
          sku_code: i.product_skus?.sku_code ?? null,
        }
      })

      await sendOrderConfirmationEmail({
        orderId: order.id,
        customerName: order.customer_name || "Cliente",
        customerEmail: order.customer_email,
        shippingAddress: order.shipping_address || "",
        totalAmount: order.total_amount,
        wompiTransactionId: order.wompi_transaction_id,
        items,
      })
    }
  }

  return { received: true }
}