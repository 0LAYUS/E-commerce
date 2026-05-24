import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type BogoOffer = {
  id: string
  name: string
  product_id: string | null
  variant_id: string | null
  active: boolean
  created_at: string
}

export async function getBogoOffers(): Promise<BogoOffer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pos_bogo_offers")
    .select("id, name, product_id, variant_id, active, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createBogoOffer(
  name: string,
  productId?: string,
  variantId?: string
): Promise<BogoOffer> {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from("pos_bogo_offers")
    .insert([{
      name,
      product_id: productId || null,
      variant_id: variantId || null,
      active: true,
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateBogoOffer(
  id: string,
  updates: { name?: string; active?: boolean }
): Promise<BogoOffer> {
  const adminClient = await createAdminClient()

  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.active !== undefined) payload.active = updates.active

  const { data, error } = await adminClient
    .from("pos_bogo_offers")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteBogoOffer(id: string): Promise<void> {
  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from("pos_bogo_offers")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}