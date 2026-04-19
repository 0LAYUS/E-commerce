export type CartItem = {
  id: string
  product_id: string
  variant_id?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  sku_code?: string
}

export type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
}
