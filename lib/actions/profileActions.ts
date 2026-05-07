"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const password = formData.get("password") as string;

  // Actualizar perfil en tabla "profiles"
  const updates: any = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (phone) updates.phone = phone;
  if (address) updates.address = address;

  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (profileError) {
      throw new Error("Error al actualizar información básica: " + profileError.message);
    }
  }

  // Actualizar contraseña si se envió una nueva
  if (password && password.trim() !== "") {
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    });

    if (authError) {
      throw new Error("Error al actualizar la contraseña: " + authError.message);
    }
  }

  revalidatePath("/profile");
  return { success: true, message: "Perfil actualizado correctamente." };
}
