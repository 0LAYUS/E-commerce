import { createClient } from "@/lib/supabase/server"
import { optimizeImage } from "@/lib/image-processor"
import type { OptionDef, ProductImage, VariantImage } from "@/features/products/types/product.types"
import {
  findOptionTypesByProduct,
  findOptionValuesByTypeIds,
  findOptionValuesByIds,
  findSkusByProduct,
  findSkuIdsByProduct,
  findSkuOptionValues,
  findProductImages,
  findVariantImages,
  insertProduct,
  updateProduct as repoUpdateProduct,
  insertOptionType,
  insertOptionValue,
  insertSku,
  insertSkuOptionValue,
  insertProductImage,
  updateProductImage,
  insertVariantImage,
  deleteVariantImagesBySkuId,
  deleteVariantImageById,
  deleteProductImagesByIds,
  deleteAllProductImages,
  deleteOptionTypesByProduct,
  deleteOptionValuesByProduct,
  deleteSkusByProduct,
  deleteSkuOptionValuesBySkuIds,
  deleteSkuById,
  updateSku,
  countOrderItemsByProduct,
  countOrderItemsByVariant,
  countPosSalesByProduct,
  countPosSalesByVariant,
  findProductById,
} from "@/features/products/repositories/productRepository"

// ============================================
// Private helpers
// ============================================

type ImageOrderEntry = { type: "existing"; id: string } | { type: "new" }

function parseImageOrder(raw: FormDataEntryValue | null): ImageOrderEntry[] | null {
  if (!raw || typeof raw !== "string") return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((e) => e && (e.type === "existing" || e.type === "new"))
  } catch { return null }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function normalizeImageFiles(formData: FormData): File[] {
  const files = formData.getAll("images").filter((f): f is File => {
    if (!(f instanceof File) || f.size === 0) return false
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      throw new Error(`Formato no soportado: ${f.name || "archivo"}. Use JPG, PNG, WebP, GIF, BMP o TIFF.`)
    }
    if (f.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo muy grande (${f.name}): ${(f.size / 1024 / 1024).toFixed(1)}MB. Máximo 10MB.`)
    }
    return true
  })
  const single = formData.get("image")
  if (files.length === 0 && single instanceof File && single.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(single.type)) {
      throw new Error(`Formato no soportado. Use JPG, PNG, WebP, GIF, BMP o TIFF.`)
    }
    if (single.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo muy grande: ${(single.size / 1024 / 1024).toFixed(1)}MB. Máximo 10MB.`)
    }
    return [single]
  }
  return files
}

function extractStoragePaths(urls: string[]): string[] {
  return urls.map((url) => {
    const match = url.match(/\/product-images\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : ""
  }).filter(Boolean)
}

async function uploadOptimizedImage(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  file: File,
  index: number
): Promise<string> {
  const buffer = await file.arrayBuffer()
  let optimized: { buffer: Uint8Array }

  try {
    optimized = await optimizeImage(new Uint8Array(buffer))
  } catch {
    throw new Error("Error procesando imagen. Formato no soportado o archivo corrupto.")
  }

  const filePath = `public/products/${productId}/${Date.now()}-${index}.webp`

  const { error } = await client.storage
    .from("product-images")
    .upload(filePath, new Blob([optimized.buffer as BlobPart], { type: "image/webp" }))
  if (error) throw new Error("Error subiendo imagen: " + error.message)

  const { data } = client.storage.from("product-images").getPublicUrl(filePath)
  return data.publicUrl
}

async function syncProductImages(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  files: File[],
  imageOrder: ImageOrderEntry[] | null,
  productName?: string
) {
  const existing = await findProductImages(client, productId)
  const existingMap = new Map(existing.map((img) => [img.id, img.url]))

  const fallbackOrder: ImageOrderEntry[] = [
    ...existing.map((img) => ({ type: "existing" as const, id: img.id })),
    ...files.map(() => ({ type: "new" as const })),
  ]

  const finalOrder = imageOrder && imageOrder.length > 0 ? imageOrder : fallbackOrder

  if (finalOrder.length === 0) {
    if (existing.length > 0) {
      const paths = extractStoragePaths(existing.map((img) => img.url))
      if (paths.length > 0) {
        await client.storage.from("product-images").remove(paths)
      }
    }
    await deleteAllProductImages(client, productId)
    await repoUpdateProduct(client, productId, { image_url: null })
    return
  }

  const keepIds = new Set(
    finalOrder.filter((e) => e.type === "existing").map((e) => e.id)
  )

  const toDelete = existing.filter((img) => !keepIds.has(img.id))
  if (toDelete.length > 0) {
    const paths = extractStoragePaths(toDelete.map((img) => img.url))
    if (paths.length > 0) {
      await client.storage.from("product-images").remove(paths)
    }
    await deleteProductImagesByIds(client, toDelete.map((img) => img.id))
  }

  // Temp positions to avoid conflicts
  for (let i = 0; i < existing.length; i++) {
    if (keepIds.has(existing[i].id)) {
      await updateProductImage(client, existing[i].id, { position: 1000 + i })
    }
  }

  const fileQueue = [...files]
  let firstUrl = ""

  for (let i = 0; i < finalOrder.length; i++) {
    const entry = finalOrder[i]
    if (entry.type === "existing") {
      const url = existingMap.get(entry.id) || ""
      await updateProductImage(client, entry.id, { position: i })
      if (!firstUrl && url) firstUrl = url
    } else {
      const file = fileQueue.shift()
      if (!file) continue
      const url = await uploadOptimizedImage(client, productId, file, i)
      await insertProductImage(client, { product_id: productId, url, alt: productName || null, position: i })
      if (!firstUrl) firstUrl = url
    }
  }

  await repoUpdateProduct(client, productId, { image_url: firstUrl || null })
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  if (arrays.some((a) => a.length === 0)) return []
  const result: T[][] = []
  function recurse(index: number, current: T[]) {
    if (index === arrays.length) { result.push([...current]); return }
    for (const item of arrays[index]) { current.push(item); recurse(index + 1, current); current.pop() }
  }
  recurse(0, [])
  return result
}

async function createVariantsFromFormData(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  formData: FormData,
  basePrice: number
) {
  const optionsRaw = formData.get("variant_options") as string
  const variantsRaw = formData.get("variant_data") as string
  if (!optionsRaw) return

  const options: OptionDef[] = JSON.parse(optionsRaw)
  const variantsData: { sku_code: string; stock?: number; price_override?: number | null; active?: boolean }[] =
    variantsRaw ? JSON.parse(variantsRaw) : []

  if (options.length === 0 || options.some((o) => o.values.length === 0)) {
    throw new Error("Las variantes requieren al menos una opción con valores")
  }

  const optionIds: { name: string; valueIds: { value: string; id: string }[] }[] = []

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (!opt.name.trim() || opt.values.length === 0) continue
    const type = await insertOptionType(client, { product_id: productId, name: opt.name, position: i })
    if (!type) continue

    const valueIds: { value: string; id: string }[] = []
    for (let j = 0; j < opt.values.length; j++) {
      const val = await insertOptionValue(client, { option_type_id: type.id, value: opt.values[j], position: j })
      if (val) valueIds.push({ value: val.value, id: val.id })
    }
    optionIds.push({ name: opt.name, valueIds })
  }

  const combinations = cartesian(optionIds.map((o) => o.valueIds))
  for (const combo of combinations) {
    const sku_code = combo.map((c) => c.value.toUpperCase().replace(/\s+/g, "_")).join("-")
    const entry = variantsData.find((v) => v.sku_code === sku_code)
    const sku = await insertSku(client, {
      product_id: productId,
      sku_code,
      price_override: entry?.price_override ?? null,
      stock: entry?.stock ?? 0,
      active: entry?.active ?? true,
    })
    if (!sku) continue
    for (const item of combo) {
      await insertSkuOptionValue(client, { sku_id: sku.id, option_value_id: item.id })
    }
  }
}

async function updateVariantsFromFormData(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  formData: FormData,
  basePrice: number
) {
  const optionsRaw = formData.get("variant_options") as string
  const variantsRaw = formData.get("variant_data") as string
  if (!optionsRaw) return

  const options: OptionDef[] = JSON.parse(optionsRaw)
  const variantsData: { id?: string; sku_code: string; stock?: number; price_override?: number | null; active?: boolean }[] =
    variantsRaw ? JSON.parse(variantsRaw) : []

  if (options.length === 0 || options.some((o) => o.values.length === 0)) {
    throw new Error("Las variantes requieren al menos una opción con valores")
  }

  // Get existing SKUs to preserve IDs
  const existingSkus = await findSkusByProduct(client, productId)
  const existingSkuMap = new Map(existingSkus.map((s) => [s.sku_code, s]))

  // Get expected sku_codes from new combinations
  const expectedSkuCodes = new Set(
    options
      .filter((o) => o.name.trim() && o.values.length > 0)
      .reduce<string[][]>((acc, opt) => {
        if (acc.length === 0) return opt.values.map((v) => [v])
        return acc.flatMap((combo) => opt.values.map((v) => [...combo, v]))
      }, [])
      .map((combo) => combo.map((v) => v.toUpperCase().replace(/\s+/g, "_")).join("-"))
  )

  // Delete SKUs that no longer exist in the new combination set
  for (const sku of existingSkus) {
    if (!expectedSkuCodes.has(sku.sku_code)) {
      await deleteSkuById(client, sku.id)
    }
  }

  // Delete sku_option_values FIRST (FK references product_option_values)
  await deleteSkuOptionValuesBySkuIds(client, existingSkus.map((s) => s.id))

  // Delete option types/values (cheap, no FK issues)
  await deleteOptionValuesByProduct(client, productId)
  await deleteOptionTypesByProduct(client, productId)

  // Recreate option types and values
  const optionIds: { name: string; valueIds: { value: string; id: string }[] }[] = []
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (!opt.name.trim() || opt.values.length === 0) continue
    const type = await insertOptionType(client, { product_id: productId, name: opt.name, position: i })
    if (!type) continue

    const valueIds: { value: string; id: string }[] = []
    for (let j = 0; j < opt.values.length; j++) {
      const val = await insertOptionValue(client, { option_type_id: type.id, value: opt.values[j], position: j })
      if (val) valueIds.push({ value: val.value, id: val.id })
    }
    optionIds.push({ name: opt.name, valueIds })
  }

  // Match or create SKUs preserving existing IDs
  const combinations = cartesian(optionIds.map((o) => o.valueIds))
  for (const combo of combinations) {
    const sku_code = combo.map((c) => c.value.toUpperCase().replace(/\s+/g, "_")).join("-")
    const entry = variantsData.find((v) => v.sku_code === sku_code)
    const existingSku = existingSkuMap.get(sku_code)

    let skuId: string
    if (existingSku) {
      // Update existing SKU — preserves ID so variant images stay linked
      await updateSku(client, existingSku.id, {
        stock: entry?.stock ?? 0,
        // null means "inherit base product price" — do not default to basePrice
        price_override: entry?.price_override ?? null,
        active: entry?.active ?? true,
      })
      skuId = existingSku.id
    } else {
      // Create new SKU
      const sku = await insertSku(client, {
        product_id: productId,
        sku_code,
        price_override: entry?.price_override ?? null,
        stock: entry?.stock ?? 0,
        active: entry?.active ?? true,
      })
      if (!sku) continue
      skuId = sku.id
    }

    // Link option values to SKU
    for (const item of combo) {
      await insertSkuOptionValue(client, { sku_id: skuId, option_value_id: item.id })
    }
  }
}

// ============================================
// GET
// ============================================

export async function getProductOptions(productId: string) {
  const client = await createClient()
  const types = await findOptionTypesByProduct(client, productId)
  if (types.length === 0) return []

  const values = await findOptionValuesByTypeIds(client, types.map((t) => t.id))
  const byType = new Map<string, string[]>()
  for (const v of values) {
    if (!byType.has(v.option_type_id)) byType.set(v.option_type_id, [])
    byType.get(v.option_type_id)!.push(v.value)
  }

  return types.map((t) => ({ id: t.id, name: t.name, values: byType.get(t.id) || [] }))
}

export async function getProductVariants(productId: string) {
  const client = await createClient()
  const skus = await findSkusByProduct(client, productId)
  if (skus.length === 0) return []

  const skuIds = skus.map((s) => s.id)
  const links = await findSkuOptionValues(client, skuIds)
  const optionValues = await findOptionValuesByIds(client, links.map((l) => l.option_value_id))

  const valueMap = new Map(optionValues.map((ov) => [ov.id, ov.value]))
  const linksBySku = new Map<string, string[]>()
  for (const link of links) {
    if (!linksBySku.has(link.sku_id)) linksBySku.set(link.sku_id, [])
    linksBySku.get(link.sku_id)!.push(valueMap.get(link.option_value_id) || "")
  }

  return skus.map((sku) => ({ ...sku, option_values: linksBySku.get(sku.id) || [] }))
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const client = await createClient()
  const images = await findProductImages(client, productId)
  if (images.length > 0) return images

  // Fallback: seed from product.image_url
  const product = await findProductById(client, productId)
  if (!product?.image_url) return []

  await insertProductImage(client, { product_id: productId, url: product.image_url, alt: product.name || null, position: 0 })
  return findProductImages(client, productId)
}

export async function getVariantImagesByProductId(
  productId: string
): Promise<Record<string, VariantImage[]>> {
  const client = await createClient()
  const skuIds = await findSkuIdsByProduct(client, productId)
  if (skuIds.length === 0) return {}

  const images = await findVariantImages(client, skuIds)
  const grouped: Record<string, VariantImage[]> = {}
  for (const img of images) {
    if (!grouped[img.sku_id]) grouped[img.sku_id] = []
    grouped[img.sku_id].push(img)
  }
  return grouped
}

// ============================================
// CREATE / UPDATE
// ============================================

export async function createProduct(formData: FormData) {
  const client = await createClient()
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseInt(formData.get("price") as string, 10)
  const stock = parseInt(formData.get("stock") as string, 10) || 0
  const category_id = formData.get("category_id") as string
  const hasVariants = formData.get("has_variants") === "true"
  const imageOrder = parseImageOrder(formData.get("image_order"))
  const imageFiles = normalizeImageFiles(formData)

  const product = await insertProduct(client, {
    name, description, price, category_id,
    stock: hasVariants ? 0 : stock,
    image_url: "",
  })

  try {
    if (hasVariants) await createVariantsFromFormData(client, product.id, formData, price)
    if (imageOrder !== null || imageFiles.length > 0) {
      await syncProductImages(client, product.id, imageFiles, imageOrder, name)
    }
  } catch (err) {
    try {
      const skuIds = await findSkuIdsByProduct(client, product.id)
      if (skuIds.length > 0) {
        await deleteSkuOptionValuesBySkuIds(client, skuIds)
        await deleteSkusByProduct(client, product.id)
      }
      await deleteOptionValuesByProduct(client, product.id)
      await deleteOptionTypesByProduct(client, product.id)
      await client.from("products").delete().eq("id", product.id)
    } catch (cleanupErr) {
      console.error("Error during orphan product cleanup (product.id=%s):", product.id, cleanupErr)
    }
    throw err
  }

  return product
}

export async function updateProduct(formData: FormData) {
  const client = await createClient()
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

  await repoUpdateProduct(client, id, {
    name, description, price, category_id, active,
    stock: hasVariants ? 0 : stock,
  })

  if (hasVariants) {
    await updateVariantsFromFormData(client, id, formData, price)
  } else {
    const skuIds = await findSkuIdsByProduct(client, id)
    await deleteSkuOptionValuesBySkuIds(client, skuIds)
    await deleteSkusByProduct(client, id)
    await deleteOptionValuesByProduct(client, id)
    await deleteOptionTypesByProduct(client, id)
  }

  if (formData.get("remove_all_images") === "true") {
    const existing = await findProductImages(client, id)
    if (existing.length > 0) {
      const paths = extractStoragePaths(existing.map((img) => img.url))
      if (paths.length > 0) {
        await client.storage.from("product-images").remove(paths)
      }
    }
    await deleteAllProductImages(client, id)
    await repoUpdateProduct(client, id, { image_url: null })
  } else if (imageOrder !== null || imageFiles.length > 0) {
    await syncProductImages(client, id, imageFiles, imageOrder, name)
  }
}

export async function replaceVariantImages(variantId: string, formData: FormData) {
  const client = await createClient()
  const files = normalizeImageFiles(formData)
  if (files.length === 0) throw new Error("No se encontraron imagenes validas")

  await deleteVariantImagesBySkuId(client, variantId)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    let optimized: { buffer: Uint8Array; width?: number; height?: number }

    try {
      const buffer = await file.arrayBuffer()
      optimized = await optimizeImage(new Uint8Array(buffer))
    } catch (err) {
      throw new Error("Error procesando imagen: " + (err instanceof Error ? err.message : "unknown"))
    }

    const filePath = `public/variants/${variantId}/${Date.now()}-${i}.webp`

    const { error } = await client.storage
      .from("product-images")
      .upload(filePath, new Blob([optimized.buffer as BlobPart], { type: "image/webp" }))
    if (error) throw new Error("Error subiendo imagen de variante: " + error.message)

    const { data } = client.storage.from("product-images").getPublicUrl(filePath)
    await insertVariantImage(client, { sku_id: variantId, url: data.publicUrl, position: i })
  }
}

export async function deleteVariantImage(imageId: string, url: string) {
  const client = await createClient()

  const match = url.match(/\/product-images\/(.+)$/)
  if (match) {
    const path = decodeURIComponent(match[1])
    await client.storage.from("product-images").remove([path])
  }

  await deleteVariantImageById(client, imageId)
}

// ============================================
// VARIANT / PRODUCT UPDATES
// ============================================

export async function updateVariant(
  variantId: string,
  updates: { stock?: number; price_override?: number | null; active?: boolean }
) {
  const client = await createClient()
  const { updateSku } = await import("@/features/products/repositories/productRepository")
  await updateSku(client, variantId, updates)
}

export async function toggleProductActive(productId: string, active: boolean) {
  const client = await createClient()
  await repoUpdateProduct(client, productId, { active })
}

// ============================================
// SALES CHECKS
// ============================================

export async function hasOnlineSales(productId: string) {
  const client = await createClient()
  return countOrderItemsByProduct(client, productId)
}

export async function hasPOSSales(productId: string) {
  const client = await createClient()
  return countPosSalesByProduct(client, productId)
}

export async function hasSales(productId: string) {
  const [online, pos] = await Promise.all([hasOnlineSales(productId), hasPOSSales(productId)])
  return online + pos
}

export async function hasVariantOnlineSales(variantId: string) {
  const client = await createClient()
  return countOrderItemsByVariant(client, variantId)
}

export async function hasVariantPOSSales(variantId: string) {
  const client = await createClient()
  return countPosSalesByVariant(client, variantId)
}

export async function hasVariantSales(variantId: string) {
  const [online, pos] = await Promise.all([hasVariantOnlineSales(variantId), hasVariantPOSSales(variantId)])
  return online + pos
}

// ============================================
// ARCHIVE / UNARCHIVE
// ============================================

export async function archiveProduct(id: string) {
  const client = await createClient()
  await repoUpdateProduct(client, id, { archived: true })
}

export async function unarchiveProduct(id: string) {
  const client = await createClient()
  await repoUpdateProduct(client, id, { archived: false })
}

export async function archiveVariant(id: string) {
  const client = await createClient()
  const { updateSku } = await import("@/features/products/repositories/productRepository")
  await updateSku(client, id, { archived: true })
}

export async function unarchiveVariant(id: string) {
  const client = await createClient()
  const { updateSku } = await import("@/features/products/repositories/productRepository")
  await updateSku(client, id, { archived: false })
}

// ============================================
// DELETE
// ============================================

/**
 * Deletes a product if it has no sales, otherwise archives it.
 * If forceArchive is true, skips the sales check.
 */
export async function deleteProduct(
  id: string,
  forceArchive?: boolean
): Promise<{ success: boolean; archived?: boolean }> {
  const client = await createClient()

  if (forceArchive) {
    await repoUpdateProduct(client, id, { archived: true })
    return { success: true, archived: true }
  }

  const salesCount = await hasSales(id)
  if (salesCount > 0) {
    await repoUpdateProduct(client, id, { archived: true })
    return { success: true, archived: true }
  }

  // 1. Delete POS BOGO offers associated to this product
  await client.from("pos_bogo_offers").delete().eq("product_id", id)

  // 2. Delete stock reservation items associated to this product
  await client.from("stock_reservation_items").delete().eq("product_id", id)

  // 3. Clean up SKUs/variants
  const skuIds = await findSkuIdsByProduct(client, id)
  if (skuIds.length > 0) {
    // Delete variant-specific BOGO offers
    await client.from("pos_bogo_offers").delete().in("variant_id", skuIds)
    // Delete variant-specific stock reservation items
    await client.from("stock_reservation_items").delete().in("variant_id", skuIds)
    // Delete option value links for SKUs
    await deleteSkuOptionValuesBySkuIds(client, skuIds)

    // Find and delete variant images from storage
    const variantImages = await findVariantImages(client, skuIds)
    if (variantImages.length > 0) {
      const paths = extractStoragePaths(variantImages.map((img) => img.url))
      if (paths.length > 0) {
        await client.storage.from("product-images").remove(paths)
      }
    }
    // Delete variant images from DB
    await client.from("product_variant_images").delete().in("sku_id", skuIds)
    // Delete SKUs
    await deleteSkusByProduct(client, id)
  }

  // 4. Clean up option values & option types
  await deleteOptionValuesByProduct(client, id)
  await deleteOptionTypesByProduct(client, id)

  // 5. Clean up product images
  const productImages = await findProductImages(client, id)
  if (productImages.length > 0) {
    const paths = extractStoragePaths(productImages.map((img) => img.url))
    if (paths.length > 0) {
      await client.storage.from("product-images").remove(paths)
    }
  }
  await deleteAllProductImages(client, id)

  // 6. Finally delete the product record
  const { error } = await client.from("products").delete().eq("id", id)
  if (error) throw new Error("Error eliminando producto: " + error.message)

  return { success: true }
}

/**
 * Deletes a variant if it has no sales, otherwise archives it.
 */
export async function deleteVariant(
  id: string
): Promise<{ success: boolean; archived?: boolean }> {
  const salesCount = await hasVariantSales(id)
  if (salesCount > 0) {
    await archiveVariant(id)
    return { success: true, archived: true }
  }

  const client = await createClient()
  await deleteSkuById(client, id)
  return { success: true }
}
