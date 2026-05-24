import type { SupabaseClient } from "@supabase/supabase-js"
import type { UserRole } from "@/features/auth/types/user.types"

// ============================================
// READ
// ============================================

/**
 * Returns a paginated list of user profiles with optional role/search filters.
 */
export async function findAllProfiles(
  client: SupabaseClient,
  options?: {
    limit?: number
    offset?: number
    role?: UserRole
    search?: string
  }
) {
  let query = client
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (options?.role) query = query.eq("role", options.role)
  if (options?.search) query = query.ilike("email", `%${options.search}%`)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset && options?.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], count: count ?? 0 }
}

/**
 * Returns a single profile by user ID.
 */
export async function findProfileById(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Returns only the role of a profile.
 * Used for lightweight role checks in API routes.
 */
export async function findProfileRole(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error) return null
  return data?.role ?? null
}

/**
 * Returns user_id values for all orders belonging to a list of user IDs.
 * Used to build order-count-per-user stats.
 */
export async function findOrderUserIds(
  client: SupabaseClient,
  userIds: string[]
) {
  if (userIds.length === 0) return []

  const { data, error } = await client
    .from("orders")
    .select("user_id")
    .in("user_id", userIds)

  if (error) {
    console.error("Error fetching order counts:", error)
    return []
  }

  return data ?? []
}

// ============================================
// WRITE
// ============================================

/**
 * Updates the role of a user profile.
 */
export async function updateProfileRole(
  client: SupabaseClient,
  userId: string,
  role: UserRole
) {
  const { error } = await client
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) throw new Error(error.message)
}
