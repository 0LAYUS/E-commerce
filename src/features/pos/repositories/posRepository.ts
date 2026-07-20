import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================
// Types
// ============================================

export type SaleItem = {
  product_id: string
  variant_id?: string
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  discount_pct: number
  subtotal: number
}

export type SalePayment = {
  method: string
  amount: number
}

export type PosSaleFilters = {
  from?: string | null
  to?: string | null
  seller_id?: string | null
  payment_method?: string | null
  limit?: number
}

// ============================================
// READ — Sales
// ============================================

/**
 * Returns a list of POS sales with seller info, applying optional date/seller/method filters.
 */
export async function findPosSales(
  client: SupabaseClient,
  filters: PosSaleFilters
) {
  let query = client
    .from("pos_sales")
    .select(`
      id,
      seller_id,
      customer_name,
      items,
      subtotal,
      discount_amount,
      total,
      payment_method,
      payment_status,
      amount_received,
      change_amount,
      notes,
      created_at,
      seller:profiles!seller_id(id, email)
    `)
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50)

  if (filters.from) query = query.gte("created_at", filters.from)
  if (filters.to) query = query.lte("created_at", filters.to)
  if (filters.seller_id) query = query.eq("seller_id", filters.seller_id)
  if (filters.payment_method) query = query.eq("payment_method", filters.payment_method)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns sales summary fields (total, payment method, cash in/out) for a date range.
 * Used by the POS reports summary endpoint.
 */
export async function findPosSalesSummary(
  client: SupabaseClient,
  from?: string | null,
  to?: string | null
) {
  let query = client
    .from("pos_sales")
    .select("total, payment_method, amount_received, change_amount, created_at")

  if (from) query = query.gte("created_at", from)
  if (to) query = query.lte("created_at", to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns POS sales for a date range for dashboard metrics.
 */
export async function findPosSalesByDateRange(
  client: SupabaseClient,
  start: Date,
  end: Date
) {
  const { data, error } = await client
    .from("pos_sales")
    .select("total, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns payment_status values for POS sales in a date range.
 * Used for grouping by status in the dashboard.
 */
export async function findPosSalesStatusesByDateRange(
  client: SupabaseClient,
  start: Date,
  end: Date
) {
  const { data, error } = await client
    .from("pos_sales")
    .select("payment_status")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Returns cash-only sales for today, used to calculate expected cash on hand.
 */
export async function findTodayCashSales(client: SupabaseClient, todayStart: Date) {
  const { data, error } = await client
    .from("pos_sales")
    .select("amount_received, change_amount")
    .eq("payment_method", "efectivo")
    .gte("created_at", todayStart.toISOString())

  if (error) throw new Error(error.message)
  return data ?? []
}

// ============================================
// WRITE — Sales
// ============================================

/**
 * Inserts a new POS sale record. Returns the created record.
 */
export async function insertPosSale(
  client: SupabaseClient,
  data: {
    seller_id: string
    customer_name: string | null
    items: string
    subtotal: number
    discount_amount: number
    discount_reason: string | null
    total: number
    payment_method: string
    payment_status: string
    amount_received: number | null
    change_amount: number | null
    notes: string | null
    channel: string
    work_order_id?: string | null
  }
) {
  const { data: sale, error } = await client
    .from("pos_sales")
    .insert([data])
    .select()
    .single()

  if (error || !sale) throw new Error(error?.message || "Error creando venta")
  return sale
}

/**
 * Deletes a POS sale by ID (used when stock decrement fails, rolling back the insert).
 */
export async function deletePosSaleById(client: SupabaseClient, id: string) {
  const { error } = await client
    .from("pos_sales")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}

// ============================================
// WRITE — Payments
// ============================================

/**
 * Inserts split-payment records for a POS sale.
 * Only used when the sale has more than one payment method.
 */
export async function insertPosSalePayments(
  client: SupabaseClient,
  saleId: string,
  payments: SalePayment[]
) {
  const rows = payments.map((p) => ({
    sale_id: saleId,
    method: p.method,
    amount: p.amount,
  }))

  const { error } = await client.from("pos_sale_payments").insert(rows)
  if (error) throw new Error(error.message)
}

// ============================================
// WRITE — Cash events
// ============================================

/**
 * Inserts a cash event (sale, cashup, adjustment) into the cash ledger.
 */
export async function insertPosCashEvent(
  client: SupabaseClient,
  data: {
    user_id: string
    type: string
    amount: number
    payment_method?: string
    notes?: string
  }
) {
  const { error } = await client.from("pos_cash_events").insert([data])
  if (error) throw new Error(error.message)
}

// ============================================
// READ — Cash events (cashup)
// ============================================

/**
 * Returns cashup events with user info, filtered by optional date range.
 */
export async function findCashupEvents(
  client: SupabaseClient,
  from?: string | null,
  to?: string | null
) {
  let query = client
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
    .eq("type", "cashup")
    .order("created_at", { ascending: false })

  if (from) query = query.gte("created_at", from)
  if (to) query = query.lte("created_at", to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

// ============================================
// RPCs — Stock
// ============================================

/**
 * Calls the DB RPC that decrements stock for all items in a POS sale.
 */
export async function decrementPosStock(
  client: SupabaseClient,
  items: SaleItem[]
) {
  const { error } = await client.rpc("decrement_pos_stock", {
    p_items: items,
  })

  if (error) throw new Error(error.message)
}
