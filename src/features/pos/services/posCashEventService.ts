import { createClient } from "@/lib/supabase/server"

type CashEvent = {
  id: string
  user_id: string
  type: string
  amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
  user: { id: string; email: string } | null
}

export type CashEventFilters = {
  from?: string | null
  to?: string | null
  userId?: string | null
}

export async function getCashEvents(filters: CashEventFilters): Promise<CashEvent[]> {
  const supabase = await createClient()

  let query = supabase
    .from("pos_cash_events")
    .select(`
      id,
      user_id,
      type,
      amount,
      payment_method,
      notes,
      created_at,
      user:profiles!user_id(id, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (filters.from) query = query.gte("created_at", filters.from)
  if (filters.to) query = query.lte("created_at", filters.to)
  if (filters.userId) query = query.eq("user_id", filters.userId)

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data as unknown) as CashEvent[]
}