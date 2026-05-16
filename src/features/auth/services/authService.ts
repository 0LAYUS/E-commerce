import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  findAllProfiles,
  findProfileById,
  findOrderUserIds,
  updateProfileRole as repoUpdateProfileRole,
} from "@/features/auth/repositories/userRepository"
import { findOrdersByUserId } from "@/features/orders/repositories/orderRepository"
import type { UserRole } from "@/features/auth/types/user.types"

/**
 * Returns all users with their profile data and an aggregated order count.
 */
export async function getAllUsers(options?: {
  limit?: number
  offset?: number
  role?: UserRole
  search?: string
}) {
  const client = await createClient()
  const { data, count } = await findAllProfiles(client, options)

  const userIds = data.map((p) => p.id)
  const orderRows = await findOrderUserIds(client, userIds)

  const orderCountMap = new Map<string, number>()
  for (const row of orderRows) {
    orderCountMap.set(row.user_id, (orderCountMap.get(row.user_id) ?? 0) + 1)
  }

  const users = data.map((profile) => ({
    ...profile,
    orderCount: orderCountMap.get(profile.id) ?? 0,
  }))

  return { users, total: count }
}

/**
 * Returns full profile, email from auth, order history, and computed stats
 * (total spent, average order value, last order date) for a given user.
 */
export async function getUserDetails(userId: string) {
  const client = await createClient()

  const profile = await findProfileById(client, userId)

  // Email is stored in auth.users, not in profiles
  const adminClient = await createAdminClient()
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const email = authUsers.users.find((u) => u.id === userId)?.email ?? ""

  const orders = await findOrdersByUserId(client, userId)

  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

  return {
    ...profile,
    email,
    orders,
    stats: {
      totalOrders: orders.length,
      totalSpent,
      avgOrderValue,
      lastOrderDate: orders[0]?.created_at ?? null,
    },
  }
}

/**
 * Updates the role of a user profile.
 */
export async function updateUserRole(userId: string, role: UserRole) {
  const client = await createClient()
  await repoUpdateProfileRole(client, userId, role)
}

/**
 * Updates a user's own profile and optionally their password.
 */
export async function updateProfile(
  userId: string,
  updates: Record<string, string>,
  password?: string
) {
  const client = await createClient()
  
  if (Object.keys(updates).length > 0) {
    const { error } = await client.from("profiles").update(updates).eq("id", userId)
    if (error) throw new Error("Error al actualizar información básica: " + error.message)
  }

  if (password && password.trim() !== "") {
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new Error("Error al actualizar la contraseña: " + error.message)
  }
}

