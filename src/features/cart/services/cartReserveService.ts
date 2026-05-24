import { createAdminClient } from "@/lib/supabase/admin"
import {
  cleanupExpiredReservations,
  createStockReservation,
  incrementSkuStock,
  incrementProductStock,
} from "@/features/cart/repositories/stockRepository"
import {
  findPendingOrdersOlderThan,
  findOrderItems,
  markOrderAsError,
} from "@/features/orders/repositories/orderRepository"

const PENDING_TIMEOUT_MINUTES = 30

/**
 * Expires timed-out PENDING orders (no Wompi response) and rolls back their stock.
 */
async function cleanupPendingOrders(client: Awaited<ReturnType<typeof createAdminClient>>) {
  const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000).toISOString()
  const pendingOrders = await findPendingOrdersOlderThan(client, cutoffTime)

  if (pendingOrders.length === 0) return

  console.log(`[CLEANUP] Found ${pendingOrders.length} PENDING orders to timeout`)

  for (const order of pendingOrders) {
    const items = await findOrderItems(client, order.id)

    for (const item of items) {
      if (item.variant_id) {
        await incrementSkuStock(client, item.variant_id, item.quantity)
      } else {
        await incrementProductStock(client, item.product_id, item.quantity)
      }
    }

    await markOrderAsError(client, order.id)
  }

  console.log(`[CLEANUP] Processed ${pendingOrders.length} PENDING orders`)
}

/**
 * Reserves stock for a list of cart items for a given user.
 * Before creating the reservation it cleans up globally expired reservations
 * and orphaned PENDING orders to free any locked stock.
 * Returns the generated reservation ID.
 */
export async function reserveCartStock(
  userId: string,
  items: unknown[]
): Promise<string> {
  const client = await createAdminClient()

  // Clean up globally expired reservations
  try {
    await cleanupExpiredReservations(client)
  } catch (err) {
    console.warn("Expired reservation cleanup failed:", err)
  }

  // Clean up orphaned PENDING orders
  try {
    await cleanupPendingOrders(client)
  } catch (err) {
    console.warn("Pending orders cleanup failed:", err)
  }

  const reservationId = await createStockReservation(client, userId, items, 15)
  return reservationId
}
