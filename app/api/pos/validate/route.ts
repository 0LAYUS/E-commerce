import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

type ValidateItem = {
  product_id: string
  variant_id?: string
  quantity: number
}

type ValidateResponse = {
  valid: boolean
  items: {
    product_id: string
    variant_id: string | null
    status: "valid" | "out_of_stock" | "inactive" | "not_found"
    available_stock: number
    unit_price: number
    subtotal: number
    name: string
    sku: string | null
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const body: { items: ValidateItem[] } = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: true, items: [] })
    }

    const supabase = await createAdminClient()
    const validatedItems: ValidateResponse["items"] = []
    let allValid = true

    for (const item of items) {
      const validated: ValidateResponse["items"][0] = {
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
        const { data: sku, error: skuError } = await supabase
          .from("product_skus")
          .select("*, product:products(name, active, archived)")
          .eq("id", item.variant_id)
          .single()

        if (skuError || !sku) {
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

        const product = sku.product as any
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
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, name, price, stock, active, archived")
          .eq("id", item.product_id)
          .single()

        if (productError || !product) {
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

    return NextResponse.json({ valid: allValid, items: validatedItems })
  } catch (error) {
    console.error("POS validate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
