import { createAdminClient } from "@/lib/supabase/admin"
import {
  findProductById,
  findSkusWithProduct,
} from "@/features/products/repositories/productRepository"

export type ValidateItem = {
  product_id: string
  variant_id?: string
  quantity: number
}

export type ValidatedItem = {
  product_id: string
  variant_id: string | null
  status: "valid" | "out_of_stock" | "inactive" | "not_found"
  available_stock: number
  unit_price: number
  subtotal: number
  name: string
  sku: string | null
}

type ProductRow = {
  name: string
  price: number
  active: boolean
  archived: boolean
}

export type ValidateResponse = {
  valid: boolean
  items: ValidatedItem[]
}

export async function validatePosItems(items: ValidateItem[]): Promise<ValidateResponse> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: true, items: [] }
  }

  const client = await createAdminClient()
  const validatedItems: ValidatedItem[] = []
  let allValid = true

  const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!)
  const productIds = items.filter((i) => !i.variant_id).map((i) => i.product_id)

  const [skus, products] = await Promise.all([
    findSkusWithProduct(client, variantIds),
    Promise.all(productIds.map((id) => findProductById(client, id))),
  ])

  const skuMap = new Map(skus.map((s) => [s.id, s]))
  const productMap = new Map(products.filter(Boolean).map((p) => [p!.id, p!]))

  for (const item of items) {
    const validated: ValidatedItem = {
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      status: "valid",
      available_stock: 0,
      unit_price: 0,
      subtotal: 0,
      name: "",
      sku: null,
    }

    if (item.variant_id) {
      const sku = skuMap.get(item.variant_id)

      if (!sku) {
        validated.status = "not_found"
        allValid = false
        validatedItems.push(validated)
        continue
      }

      if (!sku.active) {
        validated.status = "inactive"
        allValid = false
        validatedItems.push(validated)
        continue
      }

      const product = sku.product as ProductRow | null
      if (!product || !product.active || product.archived) {
        validated.status = "inactive"
        allValid = false
        validatedItems.push(validated)
        continue
      }

      validated.available_stock = sku.stock
      validated.unit_price = sku.price_override || product.price
      validated.name = product.name
      validated.sku = sku.sku_code

      if (sku.stock < item.quantity) {
        if (sku.stock === 0) {
          validated.status = "out_of_stock"
          allValid = false
        } else {
          validated.available_stock = sku.stock
        }
      }

      validated.subtotal = validated.unit_price * Math.min(item.quantity, validated.available_stock)
    } else {
      const product = productMap.get(item.product_id)

      if (!product) {
        validated.status = "not_found"
        allValid = false
        validatedItems.push(validated)
        continue
      }

      if (!product.active || product.archived) {
        validated.status = "inactive"
        allValid = false
        validatedItems.push(validated)
        continue
      }

      validated.available_stock = product.stock
      validated.unit_price = product.price
      validated.name = product.name

      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          validated.status = "out_of_stock"
          allValid = false
        } else {
          validated.available_stock = product.stock
        }
      }

      validated.subtotal = validated.unit_price * Math.min(item.quantity, validated.available_stock)
    }

    validatedItems.push(validated)
  }

  return { valid: allValid, items: validatedItems }
}