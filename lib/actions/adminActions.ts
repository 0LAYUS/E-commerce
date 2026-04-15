"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  
  const supabase = await createClient();
  const { error } = await supabase.from('categories').insert([{ name, description }]);
  
  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const supabase = await createClient();
  const { error } = await supabase.from('categories').update({ name, description }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10);
  const category_id = formData.get("category_id") as string;
  const imageFile = formData.get("image") as File;
  
  const supabase = await createClient();
  let image_url = "";

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw new Error("Error subiendo imagen: " + uploadError.message);
    }
    
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
    image_url = publicUrl;
  }

  const { error } = await supabase.from('products').insert([{
    name, description, price, stock, category_id, image_url
  }]);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10);
  const category_id = formData.get("category_id") as string;
  const imageFile = formData.get("image") as File;
  
  const supabase = await createClient();
  let updates: any = { name, description, price, stock, category_id };

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);
    if (!uploadError) {
       const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
       updates.image_url = publicUrl;
    }
  }

  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  await supabase.from('products').delete().eq('id', id);
  revalidatePath('/admin/products');
  revalidatePath('/');
}
