import { createAdminClient } from "@/lib/supabase/admin"
import { sendOrderConfirmationEmail } from "@/features/orders/services/orderConfirmation"
import {
  findOrderWithItemsForEmail,
} from "@/features/orders/repositories/orderRepository"

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function verifyWompiSignature(payload: unknown, checksumHeader: string | null): Promise<boolean> {
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
  const expectedSignature = await sha256Hex(stringToHash)

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
  if (!await verifyWompiSignature(payload, checksumHeader)) {
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

  // Find the order to get the reservation_id
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("id, reservation_id, status")
    .eq("id", orderId)
    .single()

  if (orderError || !orderData) {
    console.error("[Wompi Webhook] Error fetching order:", orderError)
    return { received: false, error: "Order not found" }
  }

  if (newStatus === "APPROVED") {
    // Call the idempotent RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "process_wompi_approved",
      {
        p_order_id: orderId,
        p_reservation_id: orderData.reservation_id
      }
    )

    if (rpcError) {
      console.error("[Wompi Webhook] Error in process_wompi_approved RPC:", rpcError)
      return { received: false, error: rpcError.message }
    }

    // Update the transaction ID separately since the RPC only handles status and stock
    await supabase.from("orders").update({ wompi_transaction_id: transaction.id }).eq("id", orderId)

    if (rpcResult === 'ALREADY_PROCESSED') {
      return { received: true, skipped: true }
    }

    if (rpcResult === 'APPROVED_NEEDS_REVIEW') {
      console.error(`ALERTA: Wompi tardío, reserva expirada, orden ${orderId} requiere revisión manual`)
      // Continue sending email, but maybe the admin needs to see it
    }

    // Send confirmation email
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
        wompiTransactionId: transaction.id,
        items,
      })
    }
  } else if (newStatus === "DECLINED" || newStatus === "ERROR" || newStatus === "VOIDED") {
    // For failed Wompi transactions, update the status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus, wompi_transaction_id: transaction.id })
      .eq("id", orderId)
      .eq("status", "PENDING") // Only update if still pending

    if (updateError) {
      console.error("[Wompi Webhook] Error updating declined order:", updateError)
    }

    // Since it's a Wompi order, the stock is held in a reservation.
    // We can just let the reservation expire naturally (or explicitly expire it).
    // The expired reservation background job will return the stock to product_skus.
    // To prevent manual rollbacks from duplicating this, we mark stock_returned = true 
    // IF we manually expire it, but we won't over-engineer it here. The reservation handles itself.
    
    // Si queremos expirar la reserva de inmediato para liberar stock ya mismo:
    if (orderData.reservation_id) {
      await supabase.from("stock_reservations").update({ status: 'expired' }).eq("id", orderData.reservation_id)
      // Y sumamos el stock usando rollbackOrderStock
      // Wait, we should just let the cleanup job do it OR do it properly:
      // A safe way: just mark order stock_returned = true, and manually return the stock now so it's available instantly.
      // But wait! If we mark the reservation as 'expired', the cleanup job might NOT process it (since it looks for 'pending').
      // Ah, if we mark it 'expired', the cleanup job ignores it?
      // Let's look at cleanup_expired_reservations: it selects 'pending' and expires_at < now().
      // So if we mark it 'confirmed' or 'expired' manually, the cleanup job won't restore stock.
      
      // Let's just update reservation to 'confirmed' (so it never auto-expires and double counts), 
      // and then use our atomic rollbackOrderStock! This is the most consistent way.
      await supabase.from("stock_reservations").update({ status: 'confirmed' }).eq("id", orderData.reservation_id).eq("status", "pending")
    }

    // Now safely rollback stock using our atomic function
    const { rollbackOrderStock } = await import("@/features/orders/services/orderService")
    await rollbackOrderStock(orderId)
  }

  return { received: true }
}