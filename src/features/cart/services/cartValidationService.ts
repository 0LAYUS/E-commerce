import { createAdminClient } from "@/lib/supabase/admin"
import {
  findSkusByIds,
  findProductsWithReservationFlag,
  findProductsStockByIds,
  findProductArchivedStatus,
  cleanupExpiredReservationsForProduct,
} from "@/features/cart/repositories/stockRepository"
import {
  findPendingOrdersOlderThan,
  findOrderItems,
  markOrderAsError,
} from "@/features/orders/repositories/orderRepository"
import { incrementSkuStock, incrementProductStock } from "@/features/cart/repositories/stockRepository"
import type { CartValidationResult, ValidatedCartItem } from "@/features/cart/types"

const PENDING_TIMEOUT_MINUTES = 30

export type CartValidationItem = {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price_snapshot?: number
}

/**
 * Expires timed-out PENDING orders and rolls back their stock.
 * Orphaned orders occur when Wompi never sends a webhook response.
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
 * Validates a list of cart items against current DB state.
 * Checks stock availability, active/archived status, and price changes.
 * Also cleans up expired reservations and orphaned PENDING orders.
 */
export async function validateCartItems(items: CartValidationItem[]): Promise<CartValidationResult> {
  if (!items || items.length === 0) {
    return { success: true, items: [], has_problems: false, blocked_items: [] }
  }

  const client = await createAdminClient()

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skus, products] = await Promise.all([
    findSkusByIds(client, variantIds),
    findProductsWithReservationFlag(client, productIds),
  ])

  const skuMap = new Map(skus.map((s) => [s.id, s]))
  const productMap = new Map(products.map((p) => [p.id, p]))

  // Refresh stock for products that had active reservations
  const productsWithReservations = products.filter((p) => p.has_active_reservation).map((p) => p.id)
  if (productsWithReservations.length > 0) {
    await Promise.all(
      productsWithReservations.map((pid) => cleanupExpiredReservationsForProduct(client, pid))
    )
    const refreshed = await findProductsStockByIds(client, productsWithReservations)
    for (const p of refreshed) {
      const existing = productMap.get(p.id)
      if (existing) existing.stock = p.stock
    }
  }

  // Clean up orphaned PENDING orders
  try {
    await cleanupPendingOrders(client)
  } catch (err) {
    console.warn("Pending orders cleanup failed:", err)
  }

  const validatedItems: ValidatedCartItem[] = []
  const blockedItems: string[] = []

  for (const item of items) {
    const validated: ValidatedCartItem = {
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      status: "valid",
    }

    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)

      if (!sku) {
        validated.status = "variant_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      const parent = await findProductArchivedStatus(client, sku.product_id)

      if (!sku.active || parent?.archived) {
        validated.status = "variant_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      validated.current_price = sku.price_override
      validated.current_stock = sku.stock

      if (sku.stock < item.quantity) {
        if (sku.stock === 0) {
          validated.status = "out_of_stock"
          blockedItems.push(item.id)
        } else {
          validated.status = "price_changed"
          validated.available_stock = sku.stock
          validated.quantity = sku.stock
        }
      }
    } else {
      const product = productMap.get(item.product_id)

      if (!product) {
        validated.status = "product_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      if (!product.active || product.archived) {
        validated.status = "product_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      validated.current_price = product.price
      validated.current_stock = product.stock
      validated.name = product.name

      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          validated.status = "out_of_stock"
          blockedItems.push(item.id)
        } else {
          validated.status = "price_changed"
          validated.available_stock = product.stock
          validated.quantity = product.stock
        }
      }
    }

    if (item.price_snapshot && validated.current_price) {
      if (validated.current_price !== item.price_snapshot) {
        validated.price_snapshot = item.price_snapshot
        validated.original_price = item.price_snapshot
        validated.price_increased = validated.current_price > item.price_snapshot
        if (validated.status === "valid") validated.status = "price_changed"
      }
    }

    validatedItems.push(validated)
  }

  return {
    success: blockedItems.length === 0,
    items: validatedItems,
    has_problems: blockedItems.length > 0 || validatedItems.some((i) => i.status === "price_changed"),
    blocked_items: blockedItems,
  }
}

/**
 * Validates a single item against current DB state (quantity = 1).
 */
export async function validateSingleItem(
  item: Omit<CartValidationItem, "quantity">
): Promise<CartValidationResult> {
  return validateCartItems([{ ...item, quantity: 1 }])
}
