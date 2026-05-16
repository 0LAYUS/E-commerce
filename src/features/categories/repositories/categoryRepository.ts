import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Returns all categories ordered by name.
 */
export async function findAllCategories(client: SupabaseClient) {
  const { data, error } = await client
    .from("categories")
    .select("id, name")
    .order("name")

  if (error) throw new Error(error.message)
  return data ?? []
}