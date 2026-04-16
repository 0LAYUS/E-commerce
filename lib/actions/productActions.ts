"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export type OptionDef = { name: string; values: string[] }
export type VariantStock = { sku_code: string; stock: number }

export type ProductInput = {
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url?: string
}

export type VariantInput = {
  sku_code: string
  price_override: number | null
  stock: number
  option_value_ids: string[]
}

// ============================================
// GET FUNCTIONS
// ============================================

export async function getProductOptions(productId: string): Promise<{ name: string; values: string[] }[]> {
  const supabase = await createClient()

  const { data: types } = await supabase
    .from("product_option_types")
    .select("id, name")
    .eq("product_id", productId)
    .order("position")

  if (!types) return []

  const result = await Promise.all(
    types.map(async (type) => {
      const { data: values } = await supabase
        .from("product_option_values")
        .select("value")
        .eq("option_type_id", type.id)
        .order("position")

      return {
        name: type.name,
        values: values?.map((v) => v.value) || [],
      }
    })
  )

  return result
}

export async function getProductVariants(productId: string) {
  const supabase = await createClient()

  const { data: skus } = await supabase
    .from("product_skus")
    .select("*")
    .eq("product_id", productId)

  if (!skus) return []

  const variants = await Promise.all(
    skus.map(async (sku) => {
      const { data: links } = await supabase
        .from("sku_option_values")
        .select("option_value_id")
        .eq("sku_id", sku.id)

      if (!links) return { ...sku, option_value_ids: [] }

      const { data: optionValues } = await supabase
        .from("product_option_values")
        .select("value")
        .in("id", links.map((l) => l.option_value_id))

      return {
        ...sku,
        option_values: optionValues?.map((v) => v.value) || [],
      }
    })
  )

  return variants
}

// ============================================
// CREATE PRODUCT (with or without variants)
// ============================================

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseInt(formData.get("price") as string, 10)
  const stock = parseInt(formData.get("stock") as string, 10) || 0
  const category_id = formData.get("category_id") as string
  const hasVariants = formData.get("has_variants") === "true"
  const imageFile = formData.get("image") as File

  let image_url = ""

  // Upload image if present
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `public/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile)

    if (uploadError) {
      throw new Error("Error subiendo imagen: " + uploadError.message)
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)
    image_url = data.publicUrl
  }

  // Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([{
      name,
      description,
      price,
      stock: hasVariants ? 0 : stock, // If has variants, global stock is 0
      category_id,
      image_url,
    }])
    .select()
    .single()

  if (productError || !product) {
    throw new Error("Error creando producto: " + productError?.message)
  }

  // If has variants, create options and SKUs
  if (hasVariants) {
    await createProductVariants(supabase, product.id, formData, price)
  }

  revalidatePath("/admin/products")
  revalidatePath("/")

  return product
}

async function createProductVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  formData: FormData,
  basePrice: number
) {
  const optionsRaw = formData.get("variant_options") as string
  const variantsRaw = formData.get("variant_data") as string

  if (!optionsRaw) return

  const options: OptionDef[] = JSON.parse(optionsRaw)
  const variantsData = variantsRaw ? JSON.parse(variantsRaw) : []

  if (options.length === 0 || options.some((o) => o.values.length === 0)) {
    throw new Error("Las variantes requieren al menos una opción con valores")
  }

  // 1. Create option types and values, collect IDs
  const optionIds: { name: string; valueIds: { value: string; id: string }[] }[] = []

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (!opt.name.trim() || opt.values.length === 0) continue

    const { data: type, error: typeError } = await supabase
      .from("product_option_types")
      .insert({ product_id: productId, name: opt.name, position: i })
      .select()
      .single()

    if (typeError || !type) continue

    const valueIds: { value: string; id: string }[] = []

    for (let j = 0; j < opt.values.length; j++) {
      const { data: val, error: valError } = await supabase
        .from("product_option_values")
        .insert({ option_type_id: type.id, value: opt.values[j], position: j })
        .select()
        .single()

      if (!valError && val) {
        valueIds.push({ value: val.value, id: val.id })
      }
    }

    optionIds.push({ name: opt.name, valueIds })
  }

  // 2. Generate all combinations (cartesian product)
  const combinations = cartesian(optionIds.map((o) => o.valueIds))

  // 3. Create SKUs
  for (const combo of combinations) {
    const sku_code = combo.map((c) => c.value.toUpperCase().replace(/\s+/g, "_")).join("-")

    // Find matching variant data by sku_code
    const variantEntry = variantsData.find((v: any) => v.sku_code === sku_code)
    const stock = variantEntry?.stock ?? 0
    const price_override = variantEntry?.price_override ?? basePrice
    const active = variantEntry?.active ?? true

    const { data: sku, error: skuError } = await supabase
      .from("product_skus")
      .insert({
        product_id: productId,
        sku_code,
        price_override,
        stock,
        active,
      })
      .select()
      .single()

    if (skuError || !sku) continue

    // Link SKU to option values
    for (const item of combo) {
      await supabase.from("sku_option_values").insert({
        sku_id: sku.id,
        option_value_id: item.id,
      })
    }
  }
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  if (arrays.some((arr) => arr.length === 0)) return []

  const result: T[][] = []

  function recurse(index: number, current: T[]) {
    if (index === arrays.length) {
      result.push([...current])
      return
    }
    for (const item of arrays[index]) {
      current.push(item)
      recurse(index + 1, current)
      current.pop()
    }
  }

  recurse(0, [])
  return result
}

// ============================================
// UPDATE PRODUCT
// ============================================

export async function updateProduct(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseInt(formData.get("price") as string, 10)
  const stock = parseInt(formData.get("stock") as string, 10) || 0
  const category_id = formData.get("category_id") as string
  const hasVariants = formData.get("has_variants") === "true"
  const active = formData.get("active") === "true"
  const imageFile = formData.get("image") as File

  const updates: Record<string, unknown> = {
    name,
    description,
    price,
    stock: hasVariants ? 0 : stock,
    category_id,
    active,
  }

  // Upload new image if present
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `public/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile)

    if (!uploadError) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)
      updates.image_url = data.publicUrl
    }
  }

  // Update product
  const { error: productError } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)

  if (productError) {
    throw new Error("Error actualizando producto: " + productError.message)
  }

  // Update variants if needed
  if (hasVariants) {
    await updateProductVariants(supabase, id, formData, price)
  } else {
    // Delete existing variants if product no longer has them
    await supabase.from("product_skus").delete().eq("product_id", id)
    await supabase.from("product_option_types").delete().eq("product_id", id)
  }

  revalidatePath("/admin/products")
  revalidatePath("/")
}

async function updateProductVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  formData: FormData,
  basePrice: number
) {
  const optionsRaw = formData.get("variant_options") as string
  const variantsRaw = formData.get("variant_data") as string

  // Delete existing variants first
  const { data: existingSKUs } = await supabase
    .from("product_skus")
    .select("id")
    .eq("product_id", productId)

  if (existingSKUs && existingSKUs.length > 0) {
    for (const sku of existingSKUs) {
      await supabase.from("sku_option_values").delete().eq("sku_id", sku.id)
    }
    await supabase.from("product_skus").delete().eq("product_id", productId)
  }

  // Delete existing option types
  await supabase.from("product_option_types").delete().eq("product_id", productId)

  if (!optionsRaw) return

  const options: OptionDef[] = JSON.parse(optionsRaw)
  const variantsData = variantsRaw ? JSON.parse(variantsRaw) : []

  if (options.length === 0 || options.some((o) => o.values.length === 0)) return

  // Create new option types and values
  const optionIds: { name: string; valueIds: { value: string; id: string }[] }[] = []

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (!opt.name.trim() || opt.values.length === 0) continue

    const { data: type } = await supabase
      .from("product_option_types")
      .insert({ product_id: productId, name: opt.name, position: i })
      .select()
      .single()

    if (!type) continue

    const valueIds: { value: string; id: string }[] = []

    for (let j = 0; j < opt.values.length; j++) {
      const { data: val } = await supabase
        .from("product_option_values")
        .insert({ option_type_id: type.id, value: opt.values[j], position: j })
        .select()
        .single()

      if (val) valueIds.push({ value: val.value, id: val.id })
    }

    optionIds.push({ name: opt.name, valueIds })
  }

  // Generate and create SKUs
  const combinations = cartesian(optionIds.map((o) => o.valueIds))

  for (const combo of combinations) {
    const sku_code = combo.map((c) => c.value.toUpperCase().replace(/\s+/g, "_")).join("-")
    
    // Find variant data by SKU code
    const variantEntry = variantsData.find((v: any) => v.sku_code === sku_code)
    const stock = variantEntry?.stock ?? 0
    const price_override = variantEntry?.price_override ?? basePrice
    const active = variantEntry?.active ?? true

    const { data: sku } = await supabase
      .from("product_skus")
      .insert({
        product_id: productId,
        sku_code,
        price_override,
        stock,
        active,
      })
      .select()
      .single()

    if (!sku) continue

    for (const item of combo) {
      await supabase.from("sku_option_values").insert({
        sku_id: sku.id,
        option_value_id: item.id,
      })
    }
  }
}

// ============================================
// UPDATE VARIANT STOCK / PRICE / ACTIVE
// ============================================

export async function updateVariant(variantId: string, updates: { stock?: number; price_override?: number | null; active?: boolean }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("product_skus")
    .update(updates)
    .eq("id", variantId)

  if (error) throw new Error("Error actualizando variante: " + error.message)

  revalidatePath("/admin/products")
}

// Keep for backwards compatibility
export async function updateVariantStock(variantId: string, stock: number) {
  return updateVariant(variantId, { stock })
}

// ============================================
// TOGGLE PRODUCT ACTIVE
// ============================================

export async function toggleProductActive(productId: string, active: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId)

  if (error) throw new Error("Error actualizando producto: " + error.message)

  revalidatePath("/admin/products")
  revalidatePath("/")
}

// ============================================
// DELETE PRODUCT
// ============================================

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  await supabase.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
  revalidatePath("/")
}
