import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================
// READ — Products
// ============================================

/**
 * Returns a single product by ID including name, image, price, stock, and flags.
 */
export async function findProductById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("products")
    .select("id, name, description, price, stock, active, archived, category_id, image_url")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }

  return data
}

/**
 * Counts non-archived products belonging to a category.
 */
export async function countProductsByCategory(
  client: SupabaseClient,
  categoryId: string
) {
  const { count, error } = await client
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("archived", false)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Inserts a new product record. Returns the created product.
 */
export async function insertProduct(
  client: SupabaseClient,
  data: {
    name: string
    description: string
    price: number
    stock: number
    category_id: string
    image_url: string
  }
) {
  const { data: product, error } = await client
    .from("products")
    .insert([data])
    .select()
    .single()

  if (error) throw new Error("Error creando producto: " + error.message)
  return product
}

/**
 * Updates a product record by ID.
 */
export async function updateProduct(
  client: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
) {
  const { error } = await client
    .from("products")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error("Error actualizando producto: " + error.message)
}

// ============================================
// READ — Options
// ============================================

/**
 * Returns option types (e.g. Color, Talla) for a product, ordered by position.
 */
export async function findOptionTypesByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { data, error } = await client
    .from("product_option_types")
    .select("id, name")
    .eq("product_id", productId)
    .order("position")

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns option values for a list of option type IDs, ordered by position.
 */
export async function findOptionValuesByTypeIds(
  client: SupabaseClient,
  typeIds: string[]
) {
  if (typeIds.length === 0) return []

  const { data, error } = await client
    .from("product_option_values")
    .select("id, value, option_type_id, position")
    .in("option_type_id", typeIds)
    .order("position")

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns option values by their own IDs.
 */
export async function findOptionValuesByIds(
  client: SupabaseClient,
  ids: string[]
) {
  if (ids.length === 0) return []

  const { data, error } = await client
    .from("product_option_values")
    .select("id, value")
    .in("id", ids)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Inserts an option type for a product. Returns the created record.
 */
export async function insertOptionType(
  client: SupabaseClient,
  data: { product_id: string; name: string; position: number }
) {
  const { data: type, error } = await client
    .from("product_option_types")
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return type
}

/**
 * Inserts an option value for an option type. Returns the created record.
 */
export async function insertOptionValue(
  client: SupabaseClient,
  data: { option_type_id: string; value: string; position: number }
) {
  const { data: val, error } = await client
    .from("product_option_values")
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return val
}

/**
 * Deletes all option types belonging to a product.
 */
export async function deleteOptionTypesByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { error } = await client
    .from("product_option_types")
    .delete()
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
}

// ============================================
// READ — SKUs
// ============================================

/**
 * Returns all SKUs for a product.
 */
export async function findSkusByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { data, error } = await client
    .from("product_skus")
    .select("*")
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns only the IDs of SKUs for a product.
 */
export async function findSkuIdsByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { data, error } = await client
    .from("product_skus")
    .select("id")
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
  return (data ?? []).map((s) => s.id)
}

/**
 * Returns SKU-to-option-value links for a list of SKU IDs.
 */
export async function findSkuOptionValues(
  client: SupabaseClient,
  skuIds: string[]
) {
  if (skuIds.length === 0) return []

  const { data, error } = await client
    .from("sku_option_values")
    .select("sku_id, option_value_id")
    .in("sku_id", skuIds)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Inserts a SKU record. Returns the created SKU.
 */
export async function insertSku(
  client: SupabaseClient,
  data: {
    product_id: string
    sku_code: string
    price_override: number
    stock: number
    active: boolean
  }
) {
  const { data: sku, error } = await client
    .from("product_skus")
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return sku
}

/**
 * Inserts a link between a SKU and an option value.
 */
export async function insertSkuOptionValue(
  client: SupabaseClient,
  data: { sku_id: string; option_value_id: string }
) {
  const { error } = await client.from("sku_option_values").insert(data)
  if (error) throw new Error(error.message)
}

/**
 * Updates a SKU record (stock, price_override, active, archived).
 */
export async function updateSku(
  client: SupabaseClient,
  id: string,
  updates: { stock?: number; price_override?: number | null; active?: boolean; archived?: boolean }
) {
  const { error } = await client
    .from("product_skus")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error("Error actualizando variante: " + error.message)
}

/**
 * Deletes all SKU records for a product.
 */
export async function deleteSkusByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { error } = await client
    .from("product_skus")
    .delete()
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
}

/**
 * Deletes a single SKU record by ID.
 */
export async function deleteSkuById(client: SupabaseClient, id: string) {
  const { error } = await client
    .from("product_skus")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}

/**
 * Deletes all option-value links for a list of SKU IDs.
 */
export async function deleteSkuOptionValuesBySkuIds(
  client: SupabaseClient,
  skuIds: string[]
) {
  if (skuIds.length === 0) return

  for (const skuId of skuIds) {
    const { error } = await client
      .from("sku_option_values")
      .delete()
      .eq("sku_id", skuId)

    if (error) throw new Error(error.message)
  }
}

// ============================================
// READ — Images
// ============================================

/**
 * Returns SKU records by a list of IDs, including parent product name and active/archived status.
 */
export async function findSkusWithProduct(
  client: SupabaseClient,
  ids: string[]
) {
  if (ids.length === 0) return []

  const { data, error } = await client
    .from("product_skus")
    .select("*, product:products(name, active, archived)")
    .in("id", ids)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns all images for a product, ordered by position.
 */
export async function findProductImages(
  client: SupabaseClient,
  productId: string
) {
  const { data, error } = await client
    .from("product_images")
    .select("id, product_id, url, alt, position")
    .eq("product_id", productId)
    .order("position")

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns all variant images for a list of SKU IDs, ordered by position.
 */
export async function findVariantImages(
  client: SupabaseClient,
  skuIds: string[]
) {
  if (skuIds.length === 0) return []

  const { data, error } = await client
    .from("product_variant_images")
    .select("id, sku_id, url, alt, position")
    .in("sku_id", skuIds)
    .order("position")

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Inserts a product image record. Returns the created record.
 */
export async function insertProductImage(
  client: SupabaseClient,
  data: { product_id: string; url: string; alt: string | null; position: number }
) {
  const { data: image, error } = await client
    .from("product_images")
    .insert(data)
    .select("id, product_id, url, alt, position")

  if (error) throw new Error("Error guardando imagen: " + error.message)
  return image
}

/**
 * Updates a product image record by ID (e.g. to change its position or alt).
 */
export async function updateProductImage(
  client: SupabaseClient,
  id: string,
  updates: { position?: number; alt?: string | null }
) {
  const { error } = await client
    .from("product_images")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)
}

/**
 * Deletes product image records by a list of IDs.
 */
export async function deleteProductImagesByIds(
  client: SupabaseClient,
  ids: string[]
) {
  if (ids.length === 0) return

  const { error } = await client
    .from("product_images")
    .delete()
    .in("id", ids)

  if (error) throw new Error(error.message)
}

/**
 * Deletes all images for a product.
 */
export async function deleteAllProductImages(
  client: SupabaseClient,
  productId: string
) {
  const { error } = await client
    .from("product_images")
    .delete()
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
}

/**
 * Inserts a variant image record.
 */
export async function insertVariantImage(
  client: SupabaseClient,
  data: { sku_id: string; url: string; alt?: string | null; position: number }
) {
  const { error } = await client
    .from("product_variant_images")
    .insert(data)

  if (error) throw new Error("Error guardando imagen de variante: " + error.message)
}

/**
 * Deletes all variant images for a given SKU.
 */
export async function deleteVariantImagesBySkuId(
  client: SupabaseClient,
  skuId: string
) {
  const { error } = await client
    .from("product_variant_images")
    .delete()
    .eq("sku_id", skuId)

  if (error) throw new Error(error.message)
}

// ============================================
// READ — Sales count (for archive/delete guard)
// ============================================

/**
 * Counts online order items for a product (to guard against hard delete).
 */
export async function countOrderItemsByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { count, error } = await client
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Counts online order items for a variant (to guard against hard delete).
 */
export async function countOrderItemsByVariant(
  client: SupabaseClient,
  variantId: string
) {
  const { count, error } = await client
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("variant_id", variantId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Calls the DB RPC to count POS sales for a product.
 */
export async function countPosSalesByProduct(
  client: SupabaseClient,
  productId: string
) {
  const { data, error } = await client.rpc("count_pos_sales_for_product", {
    p_product_id: productId,
  })

  if (error) {
    console.error("Error checking POS sales:", error.message)
    return 0
  }

  return data ?? 0
}

/**
 * Calls the DB RPC to count POS sales for a variant.
 */
export async function countPosSalesByVariant(
  client: SupabaseClient,
  variantId: string
) {
  const { data, error } = await client.rpc("count_pos_sales_for_variant", {
    p_variant_id: variantId,
  })

  if (error) {
    console.error("Error checking POS variant sales:", error.message)
    return 0
  }

  return data ?? 0
}
