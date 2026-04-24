"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/user.types";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Basic error handling for server action
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/register?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getAllUsers(options?: { limit?: number; offset?: number; role?: UserRole; search?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  // Apply role filter
  if (options?.role) {
    query = query.eq("role", options.role)
  }

  // Apply server-side search on email
  if (options?.search) {
    query = query.ilike("email", `%${options.search}%`)
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  // Get order counts ONLY for the user IDs we actually returned (efficient)
  const userIds = data.map(p => p.id)
  let orderCountMap = new Map<string, number>()

  if (userIds.length > 0) {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("user_id")
      .in("user_id", userIds)

    if (ordersError) {
      console.error("Error fetching order counts:", ordersError)
    } else {
      for (const order of ordersData ?? []) {
        orderCountMap.set(order.user_id, (orderCountMap.get(order.user_id) ?? 0) + 1)
      }
    }
  }

  // profiles.email contains the email directly - no need for auth.users lookup
  const usersWithOrderCount = data.map(profile => ({
    ...profile,
    email: profile.email, // already in profiles table
    orderCount: orderCountMap.get(profile.id) ?? 0
  }))

  return {
    users: usersWithOrderCount,
    total: count ?? 0
  }
}

export async function getUserDetails(userId: string) {
  const supabase = await createClient()

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (profileError) throw new Error(profileError.message)

  // Get email from admin client
  const adminSupabase = await import("@/lib/supabase/admin").then(m => m.createAdminClient())
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const email = authUsers.users.find(u => u.id === userId)?.email ?? ""

  // Get user's orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (ordersError) throw new Error(ordersError.message)

  // Calculate stats
  const totalSpent = (orders ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
  const avgOrderValue = orders && orders.length > 0 ? totalSpent / orders.length : 0

  return {
    ...profile,
    email,
    orders: orders ?? [],
    stats: {
      totalOrders: orders?.length ?? 0,
      totalSpent,
      avgOrderValue,
      lastOrderDate: orders?.[0]?.created_at ?? null
    }
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/users")
}
