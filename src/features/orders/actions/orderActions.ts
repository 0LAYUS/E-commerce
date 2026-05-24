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