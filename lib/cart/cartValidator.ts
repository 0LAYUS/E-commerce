import { createAdminClient } from "@/lib/supabase/admin"
import { CartValidationResult, ValidatedCartItem } from "@/types/cart.types"

export type CartValidationItem = {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price_snapshot?: number
}

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
      const { data: sku, error: skuError } = await supabase
        .from("product_skus")
        .select("*, product_id, sku_code, price_override, stock, active")
        .eq("id", item.variant_id)
        .single()

      if (skuError || !sku) {
        validated.status = "variant_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      if (!sku.active) {
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
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, price, stock, active, has_active_reservation")
        .eq("id", item.product_id)
        .single()

      if (productError || !product) {
        validated.status = "product_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      if (!product.active) {
        validated.status = "product_inactive"
        blockedItems.push(item.id)
        validatedItems.push(validated)
        continue
      }

      // If product has active reservation flag, cleanup expired ones first
      if (product.has_active_reservation) {
        await supabase.rpc("cleanup_expired_reservations_for_product", {
          p_product_id: product.id,
        })
        // Re-fetch product stock after cleanup
        const { data: refreshedProduct } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single()
        if (refreshedProduct) {
          product.stock = refreshedProduct.stock
        }
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