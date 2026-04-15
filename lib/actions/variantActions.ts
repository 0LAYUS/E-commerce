"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type OptionType = {
  id: string
  name: string
  position: number
  values: OptionValue[]
}

export type OptionValue = {
  id: string
  value: string
  position: number
}

export type SKU = {
  id: string
  sku_code: string
  price_override: number | null
  stock: number
  option_values: string[]
}

export async function getProductOptions(productId: string): Promise<OptionType[]> {
  const supabase = await createClient()

  const { data: types, error } = await supabase
    .from("product_option_types")
    .select("*")
    .eq("product_id", productId)
    .order("position")

  if (error || !types) return []

  const typesWithValues: OptionType[] = await Promise.all(
    types.map(async (type) => {
      const { data: values } = await supabase
        .from("product_option_values")
        .select("*")
        .eq("option_type_id", type.id)
        .order("position")

      return {
        id: type.id,
        name: type.name,
        position: type.position,
        values: values?.map((v) => ({
          id: v.id,
          value: v.value,
          position: v.position,
        })) || [],
      }
    })
  )

  return typesWithValues
}

export async function getProductSKUs(productId: string): Promise<SKU[]> {
  const supabase = await createClient()

  const { data: skus, error } = await supabase
    .from("product_skus")
    .select("*")
    .eq("product_id", productId)

  if (error || !skus) return []

  const skusWithValues: SKU[] = await Promise.all(
    skus.map(async (sku) => {
      const { data: skuValues } = await supabase
        .from("sku_option_values")
        .select("option_value_id")
        .eq("sku_id", sku.id)

      const { data: optionValues } = await supabase
        .from("product_option_values")
        .select("value")
        .in("id", skuValues?.map((sv) => sv.option_value_id) || [])

      return {
        id: sku.id,
        sku_code: sku.sku_code,
        price_override: sku.price_override,
        stock: sku.stock,
        option_values: optionValues?.map((ov) => ov.value) || [],
      }
    })
  )

  return skusWithValues
}

export async function saveProductOptions(
  productId: string,
  options: { name: string; values: string[] }[]
) {
  const supabase = await createClient()

  await supabase
    .from("product_option_types")
    .delete()
    .eq("product_id", productId)

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (!opt.name.trim() || opt.values.length === 0) continue

    const { data: type, error: typeError } = await supabase
      .from("product_option_types")
      .insert({ product_id: productId, name: opt.name, position: i })
      .select()
      .single()

    if (typeError || !type) continue

    for (let j = 0; j < opt.values.length; j++) {
      const val = opt.values[j]
      if (!val.trim()) continue

      await supabase.from("product_option_values").insert({
        option_type_id: type.id,
        value: val,
        position: j,
      })
    }
  }

  revalidatePath(`/admin/products`)
}

export async function generateSKUs(productId: string, productName: string) {
  const supabase = await createClient()

  await supabase.from("product_skus").delete().eq("product_id", productId)
  await supabase.from("sku_option_values").delete().eq("sku_id", productId)

  const options = await getProductOptions(productId)
  if (options.length === 0) return

  const combinations: { sku_code: string; option_value_ids: string[] }[] = []

  function cartesian(
    acc: { sku_code: string; option_value_ids: string[] }[],
    options: { id: string; values: { id: string; value: string }[] }[],
    index: number,
    current: { sku_code: string; option_value_ids: string[] }
  ) {
    if (index === options.length) {
      acc.push(current)
      return
    }

    for (const val of options[index].values) {
      const separator = index === 0 ? "" : "-"
      cartesian(
        acc,
        options,
        index + 1,
        {
          sku_code: current.sku_code + separator + val.value.toUpperCase().replace(/\s+/g, "_"),
          option_value_ids: [...current.option_value_ids, val.id],
        }
      )
    }
  }

  const product = await supabase
    .from("products")
    .select("price")
    .eq("id", productId)
    .single()

  const basePrice = product.data?.price || 0

  cartesian(combinations, options.map((o) => ({ id: o.id, values: o.values })), 0, {
    sku_code: productName.toUpperCase().replace(/\s+/g, "_"),
    option_value_ids: [],
  })

  for (const combo of combinations) {
    const { data: sku, error: skuError } = await supabase
      .from("product_skus")
      .insert({
        product_id: productId,
        sku_code: combo.sku_code,
        price_override: basePrice,
        stock: 0,
      })
      .select()
      .single()

    if (skuError || !sku) continue

    for (const ovId of combo.option_value_ids) {
      await supabase.from("sku_option_values").insert({
        sku_id: sku.id,
        option_value_id: ovId,
      })
    }
  }

  revalidatePath(`/admin/products`)
}

export async function updateSKUPrices(
  skus: { id: string; price_override: number | null; stock: number }[]
) {
  const supabase = await createClient()

  for (const sku of skus) {
    await supabase
      .from("product_skus")
      .update({
        price_override: sku.price_override,
        stock: sku.stock,
      })
      .eq("id", sku.id)
  }

  revalidatePath(`/admin/products`)
}

export async function getProductWithVariants(productId: string) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", productId)
    .single()

  if (!product) return null

  const options = await getProductOptions(productId)
  const skus = await getProductSKUs(productId)

  return { ...product, options, skus }
}
