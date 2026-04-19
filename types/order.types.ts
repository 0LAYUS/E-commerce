export type OrderItem = {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  name?: string
}

export type OrderStatus = "PENDING" | "APPROVED" | "DECLINED" | "ERROR"

export type Order = {
  id: string
  user_id: string
  total_amount: number
  status: OrderStatus
  customer_name: string
  customer_email: string
  shipping_address: string
  wompi_transaction_id?: string
  created_at: string
}
