"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { updateProfile as svcUpdateProfile } from "@/features/auth/services/authService"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const password = formData.get("password") as string

  const updates: Record<string, string> = {}
  if (firstName) updates.first_name = firstName
  if (lastName) updates.last_name = lastName
  if (phone) updates.phone = phone
  if (address) updates.address = address

  await svcUpdateProfile(user.id, updates, password)

  revalidatePath("/profile")
  return { success: true, message: "Perfil actualizado correctamente." }
}
