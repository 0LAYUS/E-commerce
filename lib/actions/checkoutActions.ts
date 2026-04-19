"use server"

import { createClient } from "@/lib/supabase/server"
import type { OrderItem } from "@/types/order.types"

export async function validateStock(items: OrderItem[]): Promise<{ valid: boolean; insufficient: string[] }> {
  const supabase = await createClient()
  const insufficient: string[] = []

  for (const item of items) {
    let availableStock = 0

    if (item.variant_id) {
      const { data: sku } = await supabase
        .from("product_skus")
        .select("stock, product_id")
        .eq("id", item.variant_id)
        .single()

      if (sku) {
        availableStock = sku.stock
      }
    } else {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (product) {
        availableStock = product.stock
      }
    }

    if (availableStock < item.quantity) {
      insufficient.push(item.id)
    }
  }

  return { valid: insufficient.length === 0, insufficient }
}

export async function createOrder(
  items: OrderItem[],
  totalAmount: number,
  customerName: string,
  customerEmail: string,
  shippingAddress: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Debes iniciar sesión para comprar")

  // Reserve stock atomically (check + decrement in one operation to avoid race conditions)
  for (const item of items) {
    const { data: reserved } = await supabase.rpc("reserve_stock", {
      p_sku_id: item.variant_id || null,
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
    if (!reserved) {
      throw new Error("Stock insuficiente para: " + item.name)
    }
  }

  const { data: order, error } = await supabase.from("orders")
    .insert([{
      user_id: user.id,
      total_amount: totalAmount,
      status: "PENDING",
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
    }])
    .select()
    .single()

  if (error || !order) throw new Error("Error creando orden: " + error?.message)

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    variant_id: i.variant_id || null,
    quantity: i.quantity,
    price_at_purchase: i.price,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
  if (itemsError) throw new Error("Error insertando items: " + itemsError.message)

  return order.id
}
