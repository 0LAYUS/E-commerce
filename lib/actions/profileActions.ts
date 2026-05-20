"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "No autenticado" };
  }

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const password = formData.get("password") as string;

  const updates: Record<string, string | null> = {
    id: user.id,
    email: user.email ?? null,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    phone: phone ?? null,
    address: address ?? null,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(updates, { onConflict: "id" });

  if (profileError) {
    return { success: false, message: "Error al actualizar información básica: " + profileError.message };
  }

  if (password && password.trim() !== "") {
    const { error: authError } = await supabase.auth.updateUser({
      password: password,
    });

    if (authError) {
      return { success: false, message: "Error al actualizar la contraseña: " + authError.message };
    }
  }

  revalidatePath("/profile");
  return { success: true, message: "Perfil actualizado correctamente." };
}
