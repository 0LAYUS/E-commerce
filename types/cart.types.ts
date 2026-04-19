export type CartItemValidationStatus =
  | 'valid'
  | 'product_inactive'
  | 'variant_inactive'
  | 'out_of_stock'
  | 'price_changed'

export type CartItem = {
  id: string
  product_id: string
  variant_id?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  sku_code?: string
  price_snapshot?: number
  status?: CartItemValidationStatus
}

export type ValidatedCartItem = {
  id: string
  product_id: string
  variant_id?: string
  name?: string
  price?: number
  quantity: number
  imageUrl?: string
  sku_code?: string
  price_snapshot?: number
  status: CartItemValidationStatus
  current_price?: number
  current_stock?: number
  available_stock?: number
  original_price?: number
  price_increased?: boolean
}

export type CartValidationResult = {
  success: boolean
  items: ValidatedCartItem[]
  has_problems: boolean
  blocked_items: string[]
}

export type CartValidationRequest = {
  items: Array<{
    id: string
    product_id: string
    variant_id?: string
    quantity: number
    price_snapshot?: number
  }>
}

export type ItemStatus = {
  status: CartItemValidationStatus
  current_price?: number
  current_stock?: number
  available_stock?: number
  original_price?: number
  price_increased?: boolean
}

export type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => Promise<{ success: boolean; error?: string }>
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemStatuses: Map<string, ItemStatus>
  isValidating: boolean
  revalidateCart: () => Promise<void>
  hasBlockedItems: boolean
}
