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
  subtotalAmount: number,
  customerName: string,
  shippingAddress: string,
  shippingCost: number,
  shippingZoneId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Debes iniciar sesión para comprar")

  const userEmail = user.email
  if (!userEmail) throw new Error("No se encontró email del usuario")

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skuData, productData] = await Promise.all([
    variantIds.length > 0
      ? supabase
          .from("product_skus")
          .select("id, active, product_id, price_override, stock")
          .in("id", variantIds)
      : { data: [], error: null },
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, active, archived, price, stock")
          .in("id", productIds)
      : { data: [], error: null },
  ])

  const skuMap = new Map((skuData.data || []).map((s) => [s.id, s]))
  const productMap = new Map((productData.data || []).map((p) => [p.id, p]))

  let calculatedSubtotal = 0

  for (const item of items) {
    let priceAtPurchase = 0
    let availableStock = 0

    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)
      if (!sku || !sku.active) {
        throw new Error("Variante no disponible: " + item.name)
      }
      const parentProduct = productMap.get(sku.product_id)
      if (parentProduct?.archived) {
        throw new Error("Producto archivado: " + item.name)
      }
      priceAtPurchase = sku.price_override ?? parentProduct?.price ?? 0
      availableStock = sku.stock
    } else {
      const product = productMap.get(item.product_id)
      if (!product || !product.active || product.archived) {
        throw new Error("Producto no disponible: " + item.name)
      }
      priceAtPurchase = product.price
      availableStock = product.stock
    }

    if (availableStock < item.quantity) {
      throw new Error("Stock insuficiente para: " + item.name)
    }

    calculatedSubtotal += priceAtPurchase * item.quantity
  }

  const tolerance = 1
  if (Math.abs(calculatedSubtotal - subtotalAmount) > tolerance) {
    throw new Error("El total no coincide con los precios actuales. Por favor actualiza tu carrito.")
  }

  const totalAmount = calculatedSubtotal + shippingCost

  const { data: order, error } = await supabase.from("orders")
    .insert([{
      user_id: user.id,
      total_amount: totalAmount,
      status: "PENDING",
      customer_name: customerName,
      customer_email: userEmail,
      shipping_address: shippingAddress,
      shipping_cost: shippingCost,
      shipping_zone_id: shippingZoneId || null,
    }])
    .select()
    .single()

  if (error || !order) throw new Error("Error creando orden: " + error?.message)

  const orderItems = items.map((i) => {
    let priceAtPurchase = 0
    if (i.variant_id) {
      const sku = skuMap.get(i.variant_id)
      const parentProduct = sku ? productMap.get(sku.product_id) : undefined
      priceAtPurchase = sku?.price_override ?? parentProduct?.price ?? i.price
    } else {
      const product = productMap.get(i.product_id)
      priceAtPurchase = product?.price ?? i.price
    }
    return {
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id || null,
      quantity: i.quantity,
      price_at_purchase: priceAtPurchase,
    }
  })

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
  if (itemsError) throw new Error("Error insertando items: " + itemsError.message)

  return order.id
}