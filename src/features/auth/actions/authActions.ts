"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getAllUsers as svcGetAllUsers,
  getUserDetails as svcGetUserDetails,
  updateUserRole as svcUpdateUserRole,
} from "@/features/auth/services/authService"
import type { UserRole } from "@/features/auth/types/user.types"

export async function getAllUsers(options?: {
  limit?: number
  offset?: number
  role?: UserRole
  search?: string
}) {
  return svcGetAllUsers(options)
}

export async function getUserDetails(userId: string) {
  return svcGetUserDetails(userId)
}

export async function updateUserRole(userId: string, role: UserRole) {
  await svcUpdateUserRole(userId, role)
  revalidatePath("/admin/users")
}

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

  await supabase.auth.refreshSession();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "administrador") {
      revalidatePath("/", "layout");
      redirect("/admin");
    }
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

  const { error } = await supabase.auth.signUp({
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

  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPasswordForEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "El correo es requerido" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/update-password`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Revisa tu correo para el enlace de recuperación" };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

