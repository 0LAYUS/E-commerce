import { createAdminClient } from "@/lib/supabase/admin"
import {
  incrementSkuStock,
  incrementProductStock,
} from "@/features/cart/repositories/stockRepository"
import {
  findOrderItems,
  findPendingOrdersOlderThan,
  markOrderAsError,
} from "@/features/orders/repositories/orderRepository"

const PENDING_TIMEOUT_MINUTES = 30

export type CleanupResult = {
  reservations_cleaned: number
  pending_orders_processed: number
  pending_orders_errors: number
}

export async function runCleanup(): Promise<CleanupResult> {
  const supabase = await createAdminClient()
  const results: CleanupResult = {
    reservations_cleaned: 0,
    pending_orders_processed: 0,
    pending_orders_errors: 0,
  }

  const { error: cleanupError } = await supabase.rpc("cleanup_expired_reservations")
  if (cleanupError) {
    console.error("Reservation cleanup error:", cleanupError)
    throw new Error("Reservation cleanup failed")
  }

  const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const pendingOrders = await findPendingOrdersOlderThan(supabase, cutoffTime)

  if (pendingOrders && pendingOrders.length > 0) {
    console.log(`[CRON] Found ${pendingOrders.length} PENDING orders to timeout`)

    for (const order of pendingOrders) {
      try {
        const items = await findOrderItems(supabase, order.id)

        for (const item of items) {
          if (item.variant_id) {
            await incrementSkuStock(supabase, item.variant_id, item.quantity)
          } else {
            await incrementProductStock(supabase, item.product_id, item.quantity)
          }
        }

        await markOrderAsError(supabase, order.id)
        console.log(`[CRON] Order ${order.id} marked as ERROR, stock restored`)
        results.pending_orders_processed++
      } catch (err) {
        console.error(`[CRON] Error processing order ${order.id}:`, err)
        results.pending_orders_errors++
      }
    }
  }

  return results
}