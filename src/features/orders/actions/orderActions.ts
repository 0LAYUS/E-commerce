"use server"

import { revalidatePath } from "next/cache"
import {
  getOrders,
  getOrderById,
  getOrdersForExport,
  exportOrdersToCSV,
  updateOrderStatus as svcUpdateOrderStatus,
  rollbackOrderStock as svcRollbackOrderStock,
  markOrderAsError as svcMarkOrderAsError,
  type CSVOrder as ServiceCSVOrder,
} from "@/features/orders/services/orderService"
import { sendOrderConfirmationEmail } from "@/features/orders/services/orderConfirmation"
import type {
  OrderStatus as OrderStatusType,
  OrderFilters as OrderFiltersType,
  PaginatedOrders as PaginatedOrdersType,
  OrderWithRelations as OrderWithRelationsType,
} from "@/features/orders/types/order.types"

export type CSVOrder = ServiceCSVOrder
export type OrderStatus = OrderStatusType
export type OrderFilters = OrderFiltersType
export type PaginatedOrders = PaginatedOrdersType
export type OrderWithRelations = OrderWithRelationsType

export { getOrders, getOrderById, getOrdersForExport, exportOrdersToCSV }

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderById(orderId)
  if (order && ["APPROVED", "DECLINED", "ERROR"].includes(order.status)) {
    return { success: false, error: `No se puede cambiar el estado de una orden que ya está en ${order.status}.` }
  }

  const result = await svcUpdateOrderStatus(orderId, newStatus)
  if (result.success) {
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/[id]", "page")
  }
  return result
}

export async function rollbackOrderStock(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await svcRollbackOrderStock(orderId)
  if (result.success) {
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/[id]", "page")
  }
  return result
}

export async function markOrderAsError(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await svcMarkOrderAsError(orderId)
  if (result.success) {
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/[id]", "page")
  }
  return result
}

export async function approveManualOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderById(orderId)
  if (!order || order.status !== "PENDING_MANUAL") {
    return { success: false, error: "Solo las órdenes PENDING_MANUAL pueden ser aprobadas manualmente." }
  }

  const result = await svcUpdateOrderStatus(orderId, "APPROVED")
  if (result.success) {
    // Send confirmation email
    const order = await getOrderById(orderId)
    if (order) {
      const emailData = {
        orderId: order.id,
        customerName: order.customer_name || "Cliente",
        customerEmail: order.customer_email || order.profiles?.email || "",
        shippingAddress: order.shipping_address || "",
        totalAmount: order.total_amount,
        items: (order.order_items || []).map(item => ({
          name: item.products?.name || "Producto",
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
          sku_code: item.product_skus?.sku_code || null
        }))
      }
      if (emailData.customerEmail) {
        sendOrderConfirmationEmail(emailData).catch(console.error)
      }
    }
    
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/[id]", "page")
  }
  return result
}

export async function cancelManualOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderById(orderId)
  if (!order || order.status !== "PENDING_MANUAL") {
    return { success: false, error: "Solo las órdenes PENDING_MANUAL pueden ser canceladas." }
  }

  const statusResult = await svcUpdateOrderStatus(orderId, "DECLINED")
  if (statusResult.success) {
    const rollbackResult = await svcRollbackOrderStock(orderId)
    
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/[id]", "page")
    
    if (!rollbackResult.success) {
      return { success: true, error: "Status updated to DECLINED but stock rollback failed: " + rollbackResult.error }
    }
  }
  return statusResult
}