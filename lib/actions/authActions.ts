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

export async function getAllUsers() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  const adminSupabase = await createAdminClient();
  const { data: authUsers, error: authError } =
    await adminSupabase.auth.admin.listUsers();

  if (authError) {
    console.error("Error fetching auth users:", authError);
    return data.map((profile) => ({ ...profile, email: "" }));
  }

  const emailMap: Record<string, string> = {};
  authUsers.users.forEach((user) => {
    emailMap[user.id] = user.email ?? "";
  });

  return data.map((profile) => ({
    ...profile,
    email: emailMap[profile.id] || "",
  }));
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