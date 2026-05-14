"use server"

import { createClient } from "@/lib/supabase/server"
import type { OrderStatus, OrderFilters, PaginatedOrders, OrderWithRelations } from "@/types/order.types"
import { revalidatePath } from "next/cache"

// ============================================
// GET ORDERS (Listado con filtros y paginación)
// ============================================

export async function getOrders(filters: OrderFilters): Promise<PaginatedOrders> {
  const supabase = await createClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from("orders")
    .select("*, profiles(email)", { count: "exact" })

  // Filtro por estado
  if (filters.status && filters.status !== "ALL") {
    query = query.eq("status", filters.status)
  }

  // Búsqueda por nombre, email o Wompi ID
  if (filters.search && filters.search.trim() !== "") {
    const searchTerm = `%${filters.search.trim()}%`
    query = query.or(
      `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wompi_transaction_id.ilike.${searchTerm}`
    )
  }

  // Ordenar por fecha descendente
  query = query.order("created_at", { ascending: false })

  // Paginar
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    orders: data as OrderWithRelations[],
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============================================
// GET ORDER BY ID (Detalle completo)
// ============================================

export async function getOrderById(id: string): Promise<OrderWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(email),
      order_items(
        id,
        product_id,
        variant_id,
        quantity,
        price_at_purchase,
        products(id, name, image_url),
        product_skus(id, sku_code)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // No rows
    throw new Error(error.message)
  }

  return data as OrderWithRelations
}

// ============================================
// UPDATE ORDER STATUS (Cambio manual de estado)
// ============================================

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/admin/orders/[id]", "page")

  return { success: true }
}

// ============================================
// ROLLBACK STOCK (Sin cambiar estado)
// ============================================

export async function rollbackOrderStock(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Obtener items de la orden
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId)

  if (itemsError) {
    return { success: false, error: itemsError.message }
  }

  if (!orderItems || orderItems.length === 0) {
    return { success: false, error: "No items found for this order" }
  }

  // Restaurar stock para cada item
  for (const item of orderItems) {
    if (item.variant_id) {
      const { error: skuError } = await supabase.rpc("increment_sku_stock", {
        p_sku_id: item.variant_id,
        p_quantity: item.quantity,
      })
      if (skuError) {
        return { success: false, error: `Error restoring SKU stock: ${skuError.message}` }
      }
    } else {
      const { error: productError } = await supabase.rpc("increment_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
      if (productError) {
        return { success: false, error: `Error restoring product stock: ${productError.message}` }
      }
    }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/admin/orders/[id]", "page")

  return { success: true }
}

// ============================================
// MARK AS ERROR WITH ROLLBACK (Cambio de estado + rollback)
// ============================================

export async function markOrderAsError(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar que la orden sigue en PENDING (evitar race conditions)
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  if (currentOrder.status !== "PENDING") {
    return { success: false, error: `Order is not PENDING (current: ${currentOrder.status})` }
  }

  // Obtener items y hacer rollback
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId)

  if (itemsError) {
    return { success: false, error: itemsError.message }
  }

  // Restaurar stock
  for (const item of orderItems ?? []) {
    if (item.variant_id) {
      await supabase.rpc("increment_sku_stock", {
        p_sku_id: item.variant_id,
        p_quantity: item.quantity,
      })
    } else {
      await supabase.rpc("increment_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }
  }

  // Actualizar estado a ERROR
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "ERROR" })
    .eq("id", orderId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/admin/orders/[id]", "page")

  return { success: true }
}

// ============================================
// EXPORT ORDERS TO CSV
// ============================================

export type CSVOrder = {
  id: string
  customer_name: string
  customer_email: string
  created_at: string
  status: string
  total_amount: number
  wompi_transaction_id: string | null
}

export async function exportOrdersToCSV(filters: OrderFilters): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("id, customer_name, customer_email, created_at, status, total_amount, wompi_transaction_id")

  // Filtros
  if (filters.status && filters.status !== "ALL") {
    query = query.eq("status", filters.status)
  }

  if (filters.search && filters.search.trim() !== "") {
    const searchTerm = `%${filters.search.trim()}%`
    query = query.or(
      `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wompi_transaction_id.ilike.${searchTerm}`
    )
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) throw new Error(error.message)

  if (!data || data.length === 0) {
    return ""
  }

  // CSV Header (UTF-8 with BOM for Excel compatibility)
  const BOM = "\uFEFF"
  const headers = ["ID", "Cliente", "Email", "Fecha", "Hora", "Estado", "Total (COP)", "Wompi ID"]
  const headerRow = headers.join(",")

  // Generate rows
  const rows = data.map((order) => {
    const createdDate = new Date(order.created_at)
    const dateStr = createdDate.toLocaleDateString("es-CO")
    const timeStr = createdDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    const totalStr = (order.total_amount / 100).toFixed(2)

    return [
      order.id,
      `"${order.customer_name.replace(/"/g, '""')}"`,
      `"${order.customer_email.replace(/"/g, '""')}"`,
      dateStr,
      timeStr,
      order.status,
      totalStr,
      order.wompi_transaction_id ?? "",
    ].join(",")
  })

  return BOM + headerRow + "\n" + rows.join("\n")
}

// ============================================
// GET ORDERS FOR CSV (sin paginación, para exportación)
// ============================================

export async function getOrdersForExport(filters: OrderFilters): Promise<CSVOrder[]> {
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("id, customer_name, customer_email, created_at, status, total_amount, wompi_transaction_id")

  if (filters.status && filters.status !== "ALL") {
    query = query.eq("status", filters.status)
  }

  if (filters.search && filters.search.trim() !== "") {
    const searchTerm = `%${filters.search.trim()}%`
    query = query.or(
      `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wompi_transaction_id.ilike.${searchTerm}`
    )
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return data as CSVOrder[]
}