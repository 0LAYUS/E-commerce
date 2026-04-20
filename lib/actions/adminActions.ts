"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
