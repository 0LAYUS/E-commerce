"use server"

import { createClient } from "@/lib/supabase/server"
import type { OrderItem } from "@/types/order.types"

export async function validateStock(items: OrderItem[]): Promise<{ valid: boolean; insufficient: string[] }> {
  const supabase = await createClient()
  const insufficient: string[] = []

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skuData, productData] = await Promise.all([
    variantIds.length > 0
      ? supabase
          .from("product_skus")
          .select("id, stock, active, product_id")
          .in("id", variantIds)
      : { data: [], error: null },
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, stock, active, archived")
          .in("id", productIds)
      : { data: [], error: null },
  ])

  const skuMap = new Map((skuData.data || []).map((s) => [s.id, s]))
  const productMap = new Map((productData.data || []).map((p) => [p.id, p]))

  for (const item of items) {
    let availableStock = 0

    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)

      if (!sku || !sku.active) {
        insufficient.push(item.id)
        continue
      }

      const parentProduct = productMap.get(sku.product_id)
      if (parentProduct?.archived) {
        insufficient.push(item.id)
        continue
      }

      availableStock = sku.stock
    } else {
      const product = productMap.get(item.product_id)

      if (!product || !product.active || product.archived) {
        insufficient.push(item.id)
        continue
      }

      availableStock = product.stock
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

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skuData, productData] = await Promise.all([
    variantIds.length > 0
      ? supabase
          .from("product_skus")
          .select("id, active, product_id")
          .in("id", variantIds)
      : { data: [], error: null },
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, active, archived")
          .in("id", productIds)
      : { data: [], error: null },
  ])

  const skuMap = new Map((skuData.data || []).map((s) => [s.id, s]))
  const productMap = new Map((productData.data || []).map((p) => [p.id, p]))

  for (const item of items) {
    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)
      if (!sku || !sku.active) {
        throw new Error("Variante no disponible: " + item.name)
      }
      const parentProduct = productMap.get(sku.product_id)
      if (parentProduct?.archived) {
        throw new Error("Producto archivado: " + item.name)
      }
    } else {
      const product = productMap.get(item.product_id)
      if (!product || !product.active || product.archived) {
        throw new Error("Producto no disponible: " + item.name)
      }
    }

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