"use server"

import { revalidatePath } from "next/cache"
import {
  validateStock as svcValidateStock,
  createOrder as svcCreateOrder,
} from "@/features/orders/services/orderService"
import type { OrderItem } from "@/features/orders/types/order.types"

/**
 * Checks that all cart items have sufficient stock and are active/not archived.
 */
export async function validateStock(
  items: OrderItem[]
): Promise<{ valid: boolean; insufficient: string[] }> {
  return svcValidateStock(items)
}

/**
 * Creates an order directly from the checkout form, verifying stock one last time.
 */
export async function createOrder(
  items: OrderItem[],
  subtotalAmount: number,
  customerName: string,
  shippingAddress: string,
  shippingCost: number,
  shippingZoneId?: string
): Promise<string> {
  const orderId = await svcCreateOrder(
    items,
    subtotalAmount,
    customerName,
    shippingAddress,
    shippingCost,
    shippingZoneId
  )
  
  revalidatePath("/admin/orders")
  return orderId
}