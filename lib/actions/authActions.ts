"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    redirect("/register?error=" + encodeURIComponent(error.message));
  }

  if (data?.user?.id) {
    const adminSupabase = await createAdminClient();
    await adminSupabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
      });
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

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return supabase;
}

export async function getAllUsers(options?: { limit?: number; offset?: number; role?: UserRole; search?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (options?.role) {
    query = query.eq("role", options.role)
  }

  if (options?.search) {
    query = query.ilike("email", `%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

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

  const usersWithOrderCount = data.map(profile => ({
    ...profile,
    email: profile.email,
    orderCount: orderCountMap.get(profile.id) ?? 0
  }))

  return {
    users: usersWithOrderCount,
    total: count ?? 0
  }
}

export async function getUserDetails(userId: string) {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (profileError) throw new Error(profileError.message)

  const adminSupabase = await import("@/lib/supabase/admin").then(m => m.createAdminClient())
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const email = authUsers.users.find(u => u.id === userId)?.email ?? ""

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (ordersError) throw new Error(ordersError.message)

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
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

import { headers } from "next/headers";

export async function resetPasswordForEmail(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) throw new Error("Debes proporcionar un email");

  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, message: "Te hemos enviado un enlace para restablecer tu contraseña." };
}