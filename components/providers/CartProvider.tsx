"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { CartItem, CartContextType } from "@/types/cart.types"

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("wompi-cart")
    if (stored) setItems(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem("wompi-cart", JSON.stringify(items))
  }, [items])

  const addItem = (product: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const cartId = product.variant_id || product.id
      const existing = prev.find((i) => (i.variant_id || i.id) === cartId)
      if (existing) {
        return prev.map((i) =>
          (i.variant_id || i.id) === cartId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((acc, current) => acc + current.price * current.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
