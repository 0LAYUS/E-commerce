"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============================================
// TYPES
// ============================================

export type FilterPeriod = "day" | "week" | "month" | "quarter" | "6months" | "year" | "all" | "custom"

// ============================================
// PERIOD CALCULATION
// ============================================

/**
 * Calculate start and end dates based on filter period.
 * All periods end at the end of today (23:59:59) at most.
 * Future end dates are clamped to today.
 */
export async function calculatePeriodDates(
  filter: FilterPeriod,
  customStart?: Date,
  customEnd?: Date
): Promise<{ start: Date; end: Date }> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)

  let start: Date
  let end: Date

  switch (filter) {
    case "day":
      start = getStartOfDay(now)
      end = today
      break
    case "week":
      start = new Date(getStartOfDay(now))
      start.setDate(start.getDate() - 7)
      end = today
      break
    case "month":
      start = new Date(getStartOfDay(now))
      start.setDate(start.getDate() - 30)
      end = today
      break
    case "quarter":
      start = new Date(getStartOfDay(now))
      start.setMonth(start.getMonth() - 3)
      end = today
      break
    case "6months":
      start = new Date(getStartOfDay(now))
      start.setMonth(start.getMonth() - 6)
      end = today
      break
    case "year":
      start = new Date(getStartOfDay(now))
      start.setFullYear(start.getFullYear() - 1)
      end = today
      break
    case "all":
      start = new Date(2000, 0, 1) // reasonable epoch
      end = today
      break
    case "custom":
      start = customStart ? getStartOfDay(customStart) : getStartOfDay(now)
      end = customEnd ? new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999) : today
      // Clamp end to today if it's in the future
      if (end > today) end = today
      break
    default:
      start = new Date(getStartOfDay(now))
      start.setDate(start.getDate() - 7)
      end = today
  }

  return { start, end }
}

// ============================================
// CHECK FUNCTIONS
// ============================================

/**
 * Count active (non-archived) products in a category
 */
export async function hasProducts(categoryId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("archived", false)

  if (error) throw new Error(error.message)
  return count ?? 0
}

// ============================================
// CREATE
// ============================================

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const supabase = await createClient()
  const { error } = await supabase.from("categories").insert([{ name, description }])

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
}

// ============================================
// UPDATE
// ============================================

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const supabase = await createClient()
  const { error } = await supabase.from("categories").update({ name, description }).eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
}

// ============================================
// DELETE
// ============================================

/**
 * Delete category — only allowed if no active products exist.
 * Returns { success: true } or { error: string } if blocked.
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check for active products in this category
  const productCount = await hasProducts(id)
  if (productCount > 0) {
    return {
      success: false,
      error: `No puedes eliminar esta categoría porque tiene ${productCount} producto${productCount > 1 ? "s" : ""} activo${productCount > 1 ? "s" : ""}. Primero debes eliminar o mover los productos.`,
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
  return { success: true }
}

// ============================================
// DASHBOARD METRICS (Phase 2)
// ============================================

/**
 * Get total revenue from online orders (APPROVED) + POS sales combined
 */
export async function getTotalRevenue(start: Date, end: Date): Promise<number> {
  const supabase = await createClient()

  // Online orders revenue (APPROVED only)
  const { data: onlineRevenue, error: onlineError } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "APPROVED")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (onlineError) throw new Error(onlineError.message)

  // POS sales revenue
  const { data: posRevenue, error: posError } = await supabase
    .from("pos_sales")
    .select("total")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (posError) throw new Error(posError.message)

  const onlineTotal = (onlineRevenue ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
  const posTotal = (posRevenue ?? []).reduce((sum, p) => sum + Number(p.total ?? 0), 0)

  return onlineTotal + posTotal
}

/**
 * Get POS sales count within period
 */
export async function getPOSSalesCount(start: Date, end: Date): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("pos_sales")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Get POS sales total amount within period (for breakdown display)
 */
export async function getPOSSalesTotal(start: Date, end: Date): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pos_sales")
    .select("total")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)
  return (data ?? []).reduce((sum, p) => sum + Number(p.total ?? 0), 0)
}

/**
 * Get online orders total revenue within period (for breakdown display)
 */
export async function getOnlineRevenue(start: Date, end: Date): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "APPROVED")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)
  return (data ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
}

/**
 * Get current pending stock reservations count (NOT filterable - always current)
 */
export async function getReservedStockCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("stock_reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Get best selling product within period
 */
export async function getBestSellingProduct(start: Date, end: Date): Promise<{
  id: string
  name: string
  image_url: string | null
  total_sold: number
} | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      quantity,
      products (
        id,
        name,
        image_url
      )
    `)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)

  // Aggregate by product
  const productMap = new Map<string, { id: string; name: string; image_url: string | null; total_sold: number }>()

  for (const item of data ?? []) {
    const product = item.products as unknown as { id: string; name: string; image_url: string | null } | null
    if (!product) continue

    const existing = productMap.get(product.id)
    if (existing) {
      existing.total_sold += item.quantity ?? 0
    } else {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        total_sold: item.quantity ?? 0,
      })
    }
  }

  // Sort by total_sold descending
  const sorted = Array.from(productMap.values()).sort((a, b) => b.total_sold - a.total_sold)

  return sorted[0] ?? null
}
