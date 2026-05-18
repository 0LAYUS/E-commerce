export type CartItem = {
  id: string
  product_id: string
  variant_id: string | null
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  discount_pct: number
  subtotal: number
  stock: number
  has_bogo?: boolean
  bogo_applied?: boolean
}

export type SaleResponse = {
  id: string
  customer_name: string | null
  items: CartItem[]
  subtotal: number
  discount_amount: number
  total: number
  payment_method: string
  amount_received: number | null
  change_amount: number | null
  created_at: string
}

export type SummaryData = {
  total_sales: number
  total_amount: number
  avg_ticket: number
  by_payment_method: {
    efectivo: { count: number; amount: number }
    tarjeta: { count: number; amount: number }
    transferencia: { count: number; amount: number }
    mixto: { count: number; amount: number }
  }
  efectivo_cash_in: number
}

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "mixto"
