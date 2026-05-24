"use server"

import { revalidatePath } from "next/cache"
import {
  getProductOptions as svcGetProductOptions,
  getProductVariants as svcGetProductVariants,
  getProductImages as svcGetProductImages,
  getVariantImagesByProductId as svcGetVariantImagesByProductId,
  createProduct as svcCreateProduct,
  updateProduct as svcUpdateProduct,
  updateVariant as svcUpdateVariant,
  toggleProductActive as svcToggleProductActive,
  replaceVariantImages as svcReplaceVariantImages,
  archiveProduct as svcArchiveProduct,
  unarchiveProduct as svcUnarchiveProduct,
  archiveVariant as svcArchiveVariant,
  unarchiveVariant as svcUnarchiveVariant,
  deleteProduct as svcDeleteProduct,
  deleteVariant as svcDeleteVariant,
  hasSales as svcHasSales,
  hasVariantSales as svcHasVariantSales,
} from "@/features/products/services/productService"

// ============================================
// READ
// ============================================

export const getProductOptions = svcGetProductOptions
export const getProductVariants = svcGetProductVariants
export const getProductImages = svcGetProductImages
export const getVariantImagesByProductId = svcGetVariantImagesByProductId
export const hasSales = svcHasSales
export const hasVariantSales = svcHasVariantSales


// ============================================
// CREATE & UPDATE
// ============================================

export async function createProduct(formData: FormData) {
  const result = await svcCreateProduct(formData)
  revalidatePath("/admin/products")
  return result
}

export async function updateProduct(formData: FormData) {
  await svcUpdateProduct(formData)
  revalidatePath("/admin/products")
}

export async function updateVariant(
  variantId: string,
  updates: { stock?: number; price_override?: number | null; active?: boolean }
) {
  await svcUpdateVariant(variantId, updates)
  revalidatePath("/admin/products")
}

export async function toggleProductActive(productId: string, active: boolean) {
  await svcToggleProductActive(productId, active)
  revalidatePath("/admin/products")
}

export async function replaceVariantImages(variantId: string, formData: FormData) {
  await svcReplaceVariantImages(variantId, formData)
  revalidatePath("/admin/products")
}

// ============================================
// ARCHIVE
// ============================================

export async function archiveProduct(id: string) {
  await svcArchiveProduct(id)
  revalidatePath("/admin/products")
}

export async function unarchiveProduct(id: string) {
  await svcUnarchiveProduct(id)
  revalidatePath("/admin/products")
}

export async function archiveVariant(id: string) {
  await svcArchiveVariant(id)
  revalidatePath("/admin/products")
}

export async function unarchiveVariant(id: string) {
  await svcUnarchiveVariant(id)
  revalidatePath("/admin/products")
}

// ============================================
// DELETE
// ============================================

export async function deleteProduct(
  id: string,
  forceArchive?: boolean
): Promise<{ success: boolean; archived?: boolean }> {
  const result = await svcDeleteProduct(id, forceArchive)
  if (result.success) revalidatePath("/admin/products")
  return result
}

export async function deleteVariant(
  id: string
): Promise<{ success: boolean; archived?: boolean }> {
  const result = await svcDeleteVariant(id)
  if (result.success) revalidatePath("/admin/products")
  return result
}
