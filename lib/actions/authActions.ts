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

export async function getAllUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  if (!data) return []

  // Get emails from auth.users using admin API
  const adminSupabase = await import("@/lib/supabase/admin").then(m => m.createAdminClient())
  
  const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers()

  if (authError) {
    console.error("Error fetching auth users:", authError)
    // Return profiles without emails rather than failing
    return data.map(profile => ({ ...profile, email: "" }))
  }

  // Create email lookup map
  const emailMap: Record<string, string> = {}
  authUsers.users.forEach(user => {
    emailMap[user.id] = user.email ?? ""
  })

  // Merge profiles with emails
  const usersWithEmail = data.map(profile => ({
    ...profile,
    email: emailMap[profile.id] || ""
  }))

  return usersWithEmail
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
