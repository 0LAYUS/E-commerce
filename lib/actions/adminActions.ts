"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const supabase = await createClient()
  const { error } = await supabase.from("categories").insert([{ name, description }])

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const supabase = await createClient()
  const { error } = await supabase.from("categories").update({ name, description }).eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/categories")
}
