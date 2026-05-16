import { createAdminClient } from "@/lib/supabase/admin"
import { CartValidationResult, ValidatedCartItem } from "@/features/cart/types/cart.types"

export type CartValidationItem = {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price_snapshot?: number
}

const PENDING_TIMEOUT_MINUTES = 30

export async function validateCartItems(items: CartValidationItem[]): Promise<CartValidationResult> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      success: true,
      items: [],
      has_problems: false,
      blocked_items: [],
    }
  }

  const supabase = await createAdminClient()

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skuData, productData] = await Promise.all([
    variantIds.length > 0
      ? supabase
        .from("product_skus")
        .select("*, product_id, sku_code, price_override, stock, active")
        .in("id", variantIds)
      : { data: [], error: null },
    productIds.length > 0
      ? supabase
        .from("products")
        .select("id, name, price, stock, active, archived, has_active_reservation")
        .in("id", productIds)
      : { data: [], error: null },
  ])

  const skuMap = new Map((skuData.data || []).map((sku) => [sku.id, sku]))
  const productMap = new Map((productData.data || []).map((p) => [p.id, p]))
  const productIdsWithReservations = (productData.data || [])
    .filter((p) => p.has_active_reservation)
    .map((p) => p.id)

  if (productIdsWithReservations.length > 0) {
    await Promise.all(
      productIdsWithReservations.map((pid) =>
        supabase.rpc("cleanup_expired_reservations_for_product", { p_product_id: pid })
      )
    )
    const { data: refreshedProducts } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", productIdsWithReservations)
    refreshedProducts?.forEach((p) => {
      const existing = productMap.get(p.id)
      if (existing) {
        existing.stock = p.stock
      }
    })
  }


  // Cleanup PENDING orders older than timeout (hu├®rfanas sin respuesta Wompi)
  try {
    const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000).toISOString()

    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "PENDING")
      .lt("created_at", cutoffTime)

    if (pendingOrders && pendingOrders.length > 0) {
      console.log(`[CLEANUP] Found ${pendingOrders.length} PENDING orders to timeout`)

      for (const order of pendingOrders) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, variant_id, quantity")
          .eq("order_id", order.id)

        for (const item of orderItems ?? []) {
          if (item.variant_id) {
            await supabase.rpc("increment_sku_stock", {
              p_sku_id: item.variant_id,
              p_quantity: item.quantity,
            })
          } else {
            await supabase.rpc("increment_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            })
          }
        }

        await supabase
          .from("orders")
          .update({ status: "ERROR" })
          .eq("id", order.id)
          .eq("status", "PENDING")
      }
    }
  } catch (pendingError) {
    console.warn("Pending orders cleanup failed:", pendingError)
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

      const { data: parentProduct } = await supabase
        .from("products")
        .select("archived")
        .eq("id", sku.product_id)
        .single()

      if (!sku.active || parentProduct?.archived) {
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
        if (validated.status === "valid") {
          validated.status = "price_changed"
        }
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

export async function validateSingleItem(item: Omit<CartValidationItem, "quantity">): Promise<CartValidationResult> {
  return validateCartItems([{ ...item, quantity: 1 }])
}
