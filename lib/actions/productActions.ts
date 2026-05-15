"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { OptionDef, ProductImage, VariantImage } from "@/types/product.types"

// ============================================
// GET FUNCTIONS
// ============================================

export async function getProductOptions(productId: string): Promise<{ id: string; name: string; values: string[] }[]> {
  const supabase = await createClient()

  const { data: types } = await supabase
    .from("product_option_types")
    .select("id, name")
    .eq("product_id", productId)
    .order("position")

  if (!types || types.length === 0) return []

  const typeIds = types.map((t) => t.id)

  const { data: allValues } = await supabase
    .from("product_option_values")
    .select("value, option_type_id, position")
    .in("option_type_id", typeIds)
    .order("position")

  const valuesByType = new Map<string, string[]>()
  for (const v of allValues || []) {
    if (!valuesByType.has(v.option_type_id)) {
      valuesByType.set(v.option_type_id, [])
    }
    valuesByType.get(v.option_type_id)!.push(v.value)
  }

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    values: valuesByType.get(type.id) || [],
  }))
}

export async function getProductVariants(productId: string) {
  const supabase = await createClient()

  const { data: skus } = await supabase
    .from("product_skus")
    .select("*")
    .eq("product_id", productId)

  if (!skus || skus.length === 0) return []

  const skuIds = skus.map((s) => s.id)

  const { data: links } = await supabase
    .from("sku_option_values")
    .select("sku_id, option_value_id")
    .in("sku_id", skuIds)

  const { data: optionValues } = await supabase
    .from("product_option_values")
    .select("id, value")
    .in("id", (links || []).map((l) => l.option_value_id))

  const optionValueMap = new Map((optionValues || []).map((ov) => [ov.id, ov.value]))
  const linksBySku = new Map<string, string[]>()
  for (const link of links || []) {
    if (!linksBySku.has(link.sku_id)) {
      linksBySku.set(link.sku_id, [])
    }
    linksBySku.get(link.sku_id)!.push(optionValueMap.get(link.option_value_id) || "")
  }

  return skus.map((sku) => ({
    ...sku,
    option_values: linksBySku.get(sku.id) || [],
  }))
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("product_images")
    .select("id, product_id, url, alt, position")
    .eq("product_id", productId)
    .order("position")

  if (data && data.length > 0) return data

  const { data: product } = await supabase
    .from("products")
    .select("image_url, name")
    .eq("id", productId)
    .single()

  if (!product?.image_url) return []

  const { data: seeded } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: product.image_url,
      alt: product.name || null,
      position: 0,
    })
    .select("id, product_id, url, alt, position")

  return seeded || []
}

export async function getVariantImagesByProductId(productId: string): Promise<Record<string, VariantImage[]>> {
  const supabase = await createClient()

  const { data: skus } = await supabase
    .from("product_skus")
    .select("id")
    .eq("product_id", productId)

  if (!skus || skus.length === 0) return {}

  const skuIds = skus.map((sku) => sku.id)

  const { data: images } = await supabase
    .from("product_variant_images")
    .select("id, sku_id, url, alt, position")
    .in("sku_id", skuIds)
    .order("position")

  const grouped: Record<string, VariantImage[]> = {}
  for (const image of images || []) {
    if (!grouped[image.sku_id]) grouped[image.sku_id] = []
    grouped[image.sku_id].push(image)
  }

  return grouped
}

type ImageOrderEntry = { type: "existing"; id: string } | { type: "new" }

function parseImageOrder(raw: FormDataEntryValue | null): ImageOrderEntry[] | null {
  if (!raw || typeof raw !== "string") return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((entry) => entry && (entry.type === "existing" || entry.type === "new"))
  } catch {
    return null
  }
}

function normalizeImageFiles(formData: FormData): File[] {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0)
  const single = formData.get("image")
  if (files.length === 0 && single instanceof File && single.size > 0) {
    return [single]
  }
  return files
}

async function uploadProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  file: File,
  index: number
) {
  const fileExt = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${index}.${fileExt}`
  const filePath = `public/products/${productId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file)

  if (uploadError) {
    throw new Error("Error subiendo imagen: " + uploadError.message)
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)
  return data.publicUrl
}

async function syncProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  files: File[],
  imageOrder: ImageOrderEntry[] | null,
  productName?: string
) {
  const { data: existing } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("product_id", productId)
    .order("position")

  const existingList = existing || []
  const existingMap = new Map(existingList.map((img) => [img.id, img.url]))

  const fallbackOrder: ImageOrderEntry[] = [
    ...existingList.map((img) => ({ type: "existing" as const, id: img.id })),
    ...files.map(() => ({ type: "new" as const })),
  ]

  const finalOrder = imageOrder && imageOrder.length > 0 ? imageOrder : fallbackOrder

  if (finalOrder.length === 0) {
    await supabase.from("product_images").delete().eq("product_id", productId)
    await supabase.from("products").update({ image_url: null }).eq("id", productId)
    return
  }

  const keepExistingIds = new Set(
    finalOrder.filter((entry) => entry.type === "existing").map((entry) => entry.id)
  )

  const toDelete = existingList.filter((img) => !keepExistingIds.has(img.id))
  if (toDelete.length > 0) {
    await supabase.from("product_images").delete().in("id", toDelete.map((img) => img.id))
  }

  for (let i = 0; i < existingList.length; i++) {
    const img = existingList[i]
    if (!keepExistingIds.has(img.id)) continue
    await supabase
      .from("product_images")
      .update({ position: 1000 + i })
      .eq("id", img.id)
  }

  const fileQueue = [...files]
  let firstUrl = ""

  for (let i = 0; i < finalOrder.length; i++) {
    const entry = finalOrder[i]
    if (entry.type === "existing") {
      const existingUrl = existingMap.get(entry.id) || ""
      await supabase.from("product_images").update({ position: i }).eq("id", entry.id)
      if (!firstUrl && existingUrl) firstUrl = existingUrl
    } else {
      const file = fileQueue.shift()
      if (!file) continue
      const url = await uploadProductImage(supabase, productId, file, i)
      const { error: insertError } = await supabase.from("product_images").insert({
        product_id: productId,
        url,
        alt: productName || null,
        position: i,
      })
      if (insertError) {
        throw new Error("Error guardando imagen: " + insertError.message)
      }
      if (!firstUrl) firstUrl = url
    }
  }

  await supabase
    .from("products")
    .update({ image_url: firstUrl || null })
    .eq("id", productId)
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
  const imageOrder = parseImageOrder(formData.get("image_order"))
  const imageFiles = normalizeImageFiles(formData)

  // Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([{
      name,
      description,
      price,
      stock: hasVariants ? 0 : stock, // If has variants, global stock is 0
      category_id,
      image_url: "",
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

  if (imageOrder !== null || imageFiles.length > 0) {
    await syncProductImages(supabase, product.id, imageFiles, imageOrder, name)
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
  const variantsData: Array<{ sku_code: string; stock?: number; price_override?: number | null; active?: boolean }> =
    variantsRaw ? JSON.parse(variantsRaw) : []

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
    const variantEntry = variantsData.find((v) => v.sku_code === sku_code)
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
  const imageOrder = parseImageOrder(formData.get("image_order"))
  const imageFiles = normalizeImageFiles(formData)

  const updates: Record<string, unknown> = {
    name,
    description,
    price,
    stock: hasVariants ? 0 : stock,
    category_id,
    active,
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

  if (imageOrder !== null || imageFiles.length > 0) {
    await syncProductImages(supabase, id, imageFiles, imageOrder, name)
  }

  revalidatePath("/admin/products")
  revalidatePath("/")
}

export async function replaceVariantImages(variantId: string, formData: FormData) {
  const supabase = await createClient()
  const files = normalizeImageFiles(formData)

  if (files.length === 0) return

  await supabase.from("product_variant_images").delete().eq("sku_id", variantId)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${Date.now()}-${i}.${fileExt}`
    const filePath = `public/variants/${variantId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file)

    if (uploadError) {
      throw new Error("Error subiendo imagen de variante: " + uploadError.message)
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

    await supabase.from("product_variant_images").insert({
      sku_id: variantId,
      url: data.publicUrl,
      position: i,
    })
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
  const variantsData: Array<{ sku_code: string; stock?: number; price_override?: number | null; active?: boolean }> =
    variantsRaw ? JSON.parse(variantsRaw) : []

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
    const variantEntry = variantsData.find((v) => v.sku_code === sku_code)
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
// CHECK FUNCTIONS
// ============================================

/**
 * Count order_items for a product (online orders)
 */
export async function hasOnlineSales(productId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Count POS sales for a product (checks items JSONB column)
 * Uses RPC function to count in database instead of loading all records
 */
export async function hasPOSSales(productId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("count_pos_sales_for_product", {
    p_product_id: productId,
  })

  if (error) {
    console.error("Error checking POS sales:", error.message)
    return 0
  }

  return data ?? 0
}

/**
 * Count total sales for a product (online + POS)
 */
export async function hasSales(productId: string): Promise<number> {
  const [online, pos] = await Promise.all([
    hasOnlineSales(productId),
    hasPOSSales(productId),
  ])
  return online + pos
}

/**
 * Count order_items for a specific variant (online orders)
 */
export async function hasVariantOnlineSales(variantId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("variant_id", variantId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Count POS sales for a specific variant (checks items JSONB)
 * Uses RPC function to count in database instead of loading all records
 */
export async function hasVariantPOSSales(variantId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("count_pos_sales_for_variant", {
    p_variant_id: variantId,
  })

  if (error) {
    console.error("Error checking POS variant sales:", error.message)
    return 0
  }

  return data ?? 0
}

/**
 * Count total sales for a variant (online + POS)
 */
export async function hasVariantSales(variantId: string): Promise<number> {
  const [online, pos] = await Promise.all([
    hasVariantOnlineSales(variantId),
    hasVariantPOSSales(variantId),
  ])
  return online + pos
}

// ============================================
// ARCHIVE / UNARCHIVE
// ============================================

export async function archiveProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ archived: true })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  revalidatePath("/")
}

export async function unarchiveProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ archived: false })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/archived")
  revalidatePath("/")
}

export async function archiveVariant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_skus")
    .update({ archived: true })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
}

export async function unarchiveVariant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_skus")
    .update({ archived: false })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
}

// ============================================
// DELETE PRODUCT
// ============================================

/**
 * Delete product — if it has sales, archive instead.
 * Returns { success: true } for hard delete, { success: true, archived: true } for archive.
 */
export async function deleteProduct(id: string, forceArchive?: boolean): Promise<{ success: boolean; archived?: boolean }> {
  const supabase = await createClient()

  // If forceArchive is true (pre-checked by client), archive directly without re-checking
  if (forceArchive) {
    const { error } = await supabase
      .from("products")
      .update({ archived: true })
      .eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true, archived: true }
  }

  const salesCount = await hasSales(id)
  if (salesCount > 0) {
    // Archive instead of delete to preserve order data
    const { error } = await supabase
      .from("products")
      .update({ archived: true })
      .eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true, archived: true }
  }

  // No sales — hard delete
  await supabase.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
  revalidatePath("/")
  return { success: true }
}

// ============================================
// DELETE VARIANT
// ============================================

/**
 * Delete variant — if it has sales, archive instead.
 * Returns { success: true } for hard delete, { success: true, archived: true } for archive.
 */
export async function deleteVariant(id: string): Promise<{ success: boolean; archived?: boolean }> {
  const supabase = await createClient()

  const salesCount = await hasVariantSales(id)
  if (salesCount > 0) {
    // Archive instead of delete to preserve order data
    await archiveVariant(id)
    return { success: true, archived: true }
  }

  // No sales — hard delete
  await supabase.from("product_skus").delete().eq("id", id)
  revalidatePath("/admin/products")
  return { success: true }
}
