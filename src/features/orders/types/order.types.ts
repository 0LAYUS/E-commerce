export type OrderStatus = "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "PENDING_MANUAL"

export type OrderItem = {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price?: number
  name?: string
}

// Order item con relaciones para queries completas
export type OrderItemWithRelations = {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price_at_purchase: number
  products: {
    id: string
    name: string
    image_url: string | null
  } | null
  product_skus: {
    id: string
    sku_code: string
  } | null
}

// Order con relaciones para queries completas
export type OrderWithRelations = {
  id: string
  user_id: string
  total_amount: number
  status: OrderStatus
  wompi_transaction_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  shipping_address: string
  shipping_zones?: { name: string } | null
  payment_method?: 'wompi' | 'manual'
  created_at: string
  order_items?: OrderItemWithRelations[]
  profiles?: {
    email: string
  } | null
}

// Filtros para listado de órdenes
export type OrderFilters = {
  status?: OrderStatus | "ALL"
  search?: string
  page?: number
  pageSize?: number
}

// Resultado paginado
export type PaginatedOrders = {
  orders: OrderWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}