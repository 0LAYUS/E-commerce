import { createClient } from "@/lib/supabase/server"
import {
  findOrders,
  findOrderById,
  findOrderItems,
  findOrdersForExport,
  findOrderStatus,
  insertOrder,
  insertOrderItems,
  updateOrderStatus as repoUpdateOrderStatus,
} from "@/features/orders/repositories/orderRepository"
import {
  findSkusByIds,
  findProductsByIds,
  incrementSkuStock,
  incrementProductStock,
} from "@/features/cart/repositories/stockRepository"
import type { OrderStatus, OrderFilters, PaginatedOrders, OrderWithRelations } from "@/features/orders/types/order.types"
import type { OrderItem } from "@/features/orders/types/order.types"

// ============================================
// READ
// ============================================

export async function getOrders(filters: OrderFilters): Promise<PaginatedOrders> {
  const client = await createClient()
  const { data, count } = await findOrders(client, filters)
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const total = count ?? 0

  return {
    orders: data as OrderWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getOrderById(id: string): Promise<OrderWithRelations | null> {
  const client = await createClient()
  return findOrderById(client, id) as Promise<OrderWithRelations | null>
}

// ============================================
// STATUS UPDATE
// ============================================

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const client = await createClient()
  try {
    await repoUpdateOrderStatus(client, orderId, newStatus)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================
// STOCK ROLLBACK
// ============================================

/**
 * Iterates order items and increments stock back to each product/variant.
 * Does NOT change the order status.
 */
export async function rollbackOrderStock(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const client = await createClient()

  const items = await findOrderItems(client, orderId)
  if (!items || items.length === 0) {
    return { success: false, error: "No items found for this order" }
  }

  for (const item of items) {
    if (item.variant_id) {
      await incrementSkuStock(client, item.variant_id, item.quantity)
    } else {
      await incrementProductStock(client, item.product_id, item.quantity)
    }
  }

  return { success: true }
}

/**
 * Verifies the order is PENDING, rolls back stock, then marks it as ERROR.
 */
export async function markOrderAsError(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const client = await createClient()

  const currentOrder = await findOrderStatus(client, orderId)
  if (currentOrder.status !== "PENDING") {
    return { success: false, error: `Order is not PENDING (current: ${currentOrder.status})` }
  }

  const items = await findOrderItems(client, orderId)
  for (const item of items) {
    if (item.variant_id) {
      await incrementSkuStock(client, item.variant_id, item.quantity)
    } else {
      await incrementProductStock(client, item.product_id, item.quantity)
    }
  }

  await repoUpdateOrderStatus(client, orderId, "ERROR")
  return { success: true }
}

// ============================================
// EXPORT
// ============================================

export type CSVOrder = {
  id: string
  customer_name: string
  customer_email: string
  created_at: string
  status: string
  total_amount: number
  wompi_transaction_id: string | null
}

export async function getOrdersForExport(filters: OrderFilters): Promise<CSVOrder[]> {
  const client = await createClient()
  return findOrdersForExport(client, filters) as Promise<CSVOrder[]>
}

/**
 * Builds a UTF-8 BOM CSV string from order data (Excel-compatible).
 */
export async function exportOrdersToCSV(filters: OrderFilters): Promise<string> {
  const data = await getOrdersForExport(filters)
  if (!data || data.length === 0) return ""

  const BOM = "\uFEFF"
  const headers = ["ID", "Cliente", "Email", "Fecha", "Hora", "Estado", "Total (COP)", "Wompi ID"]
  const headerRow = headers.join(",")

  const rows = data.map((order) => {
    const d = new Date(order.created_at)
    return [
      order.id,
      `"${order.customer_name.replace(/"/g, '""')}"`,
      `"${order.customer_email.replace(/"/g, '""')}"`,
      d.toLocaleDateString("es-CO"),
      d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      order.status,
      (order.total_amount / 100).toFixed(2),
      order.wompi_transaction_id ?? "",
    ].join(",")
  })

  return BOM + headerRow + "\n" + rows.join("\n")
}

// ============================================
// CHECKOUT — validate & create order
// ============================================

/**
 * Checks that all cart items have sufficient stock and are active/not archived.
 */
export async function validateStock(
  items: OrderItem[]
): Promise<{ valid: boolean; insufficient: string[] }> {
  const client = await createClient()
  const insufficient: string[] = []

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skus, products] = await Promise.all([
    findSkusByIds(client, variantIds),
    findProductsByIds(client, productIds),
  ])

  const skuMap = new Map(skus.map((s) => [s.id, s]))
  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of items) {
    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)
      if (!sku || !sku.active) { insufficient.push(item.id); continue }
      const parent = productMap.get(sku.product_id)
      if (parent?.archived) { insufficient.push(item.id); continue }
      if (sku.stock < item.quantity) insufficient.push(item.id)
    } else {
      const product = productMap.get(item.product_id)
      if (!product || !product.active || product.archived) { insufficient.push(item.id); continue }
      if (product.stock < item.quantity) insufficient.push(item.id)
    }
  }

  return { valid: insufficient.length === 0, insufficient }
}

/**
 * Validates prices server-side, verifies stock, creates the order and its items.
 * Returns the new order ID.
 */
export async function createOrder(
  items: OrderItem[],
  subtotalAmount: number,
  customerName: string,
  customerPhone: string,
  shippingAddress: string,
  shippingCost: number,
  shippingZoneId?: string,
  paymentMethod: 'wompi' | 'manual' = 'wompi'
): Promise<string> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()

  if (!user) throw new Error("Debes iniciar sesión para comprar")
  const userEmail = user.email
  if (!userEmail) throw new Error("No se encontró email del usuario")

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skus, products] = await Promise.all([
    findSkusByIds(client, variantIds),
    findProductsByIds(client, productIds),
  ])

  const skuMap = new Map(skus.map((s) => [s.id, s]))
  const productMap = new Map(products.map((p) => [p.id, p]))

  let calculatedSubtotal = 0

  for (const item of items) {
    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)
      if (!sku || !sku.active) throw new Error("Variante no disponible: " + item.name)
      const parent = productMap.get(sku.product_id)
      if (parent?.archived) throw new Error("Producto archivado: " + item.name)
      if (sku.stock < item.quantity) throw new Error("Stock insuficiente para: " + item.name)
      calculatedSubtotal += (sku.price_override ?? parent?.price ?? 0) * item.quantity
    } else {
      const product = productMap.get(item.product_id)
      if (!product || !product.active || product.archived) throw new Error("Producto no disponible: " + item.name)
      if (product.stock < item.quantity) throw new Error("Stock insuficiente para: " + item.name)
      calculatedSubtotal += product.price * item.quantity
    }
  }

  const tolerance = 1
  if (Math.abs(calculatedSubtotal - subtotalAmount) > tolerance) {
    throw new Error("El total no coincide con los precios actuales. Por favor actualiza tu carrito.")
  }

  const totalAmount = calculatedSubtotal + shippingCost

  const order = await insertOrder(client, {
    user_id: user.id,
    total_amount: totalAmount,
    status: paymentMethod === 'manual' ? "PENDING_MANUAL" : "PENDING",
    payment_method: paymentMethod,
    customer_name: customerName,
    customer_email: userEmail,
    customer_phone: customerPhone,
    shipping_address: shippingAddress,
    shipping_cost: shippingCost,
    shipping_zone_id: shippingZoneId || null,
  })

  const orderItems = items.map((i) => {
    let priceAtPurchase = 0
    if (i.variant_id) {
      const sku = skuMap.get(i.variant_id)
      const parent = sku ? productMap.get(sku.product_id) : undefined
      priceAtPurchase = sku?.price_override ?? parent?.price ?? i.price
    } else {
      priceAtPurchase = productMap.get(i.product_id)?.price ?? i.price
    }
    return {
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id || null,
      quantity: i.quantity,
      price_at_purchase: priceAtPurchase,
    }
  })

  await insertOrderItems(client, orderItems)
  return order.id
}
