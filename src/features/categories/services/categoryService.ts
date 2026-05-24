import { createClient } from "@/lib/supabase/server"
import { findAllCategories } from "@/features/categories/repositories/categoryRepository"

export async function getAllCategories() {
  const client = await createClient()
  return findAllCategories(client)
}