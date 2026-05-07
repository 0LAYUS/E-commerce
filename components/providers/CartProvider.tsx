"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { CartItem, CartItemValidationStatus, CartValidationResult, ItemStatus, CartContextType } from "@/types/cart.types"

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [itemStatuses, setItemStatuses] = useState<Map<string, ItemStatus>>(new Map())
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("wompi-cart")
    if (stored) setItems(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem("wompi-cart", JSON.stringify(items))
  }, [items])

  const validateItem = useCallback(async (item: Omit<CartItem, "quantity"> & { quantity?: number }): Promise<CartValidationResult> => {
    const response = await fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          id: item.variant_id || item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity || 1,
          price_snapshot: item.price,
        }],
      }),
    })
    return response.json()
  }, [])

  const revalidateCart = useCallback(async () => {
    if (items.length === 0) {
      setItemStatuses(new Map())
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.variant_id || item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price_snapshot: item.price_snapshot || item.price,
          })),
        }),
      })
      const result: CartValidationResult = await response.json()

      const newStatuses = new Map<string, ItemStatus>()
      const updatedItems: CartItem[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const validatedItem = result.items.find(
          (v) => v.id === (item.variant_id || item.id)
        )

        if (validatedItem) {
          const cartId = item.variant_id || item.id
          newStatuses.set(cartId, {
            status: validatedItem.status,
            current_price: validatedItem.current_price,
            current_stock: validatedItem.current_stock,
            available_stock: validatedItem.available_stock,
            original_price: validatedItem.original_price,
            price_increased: validatedItem.price_increased,
          })

          if (validatedItem.status === "price_changed" && validatedItem.available_stock !== undefined) {
            updatedItems.push({ ...item, quantity: validatedItem.quantity })
          } else {
            updatedItems.push(item)
          }
        } else {
          updatedItems.push(item)
        }
      }

      setItemStatuses(newStatuses)
      if (JSON.stringify(items) !== JSON.stringify(updatedItems)) {
        setItems(updatedItems)
      }
    } catch (error) {
      console.error("Cart revalidation failed:", error)
    } finally {
      setIsValidating(false)
    }
  }, [items])

  useEffect(() => {
    if (items.length > 0) {
      revalidateCart()
    }
  }, [items.length, revalidateCart])

  const addItem = useCallback(async (product: Omit<CartItem, "quantity"> & { quantity?: number }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await validateItem(product)

      if (!result.success && result.has_problems) {
        const firstProblem = result.items.find((i) => i.status !== "valid")
        if (firstProblem) {
          switch (firstProblem.status) {
            case "product_inactive":
              return { success: false, error: "Este producto no está disponible" }
            case "variant_inactive":
              return { success: false, error: "Esta variante no está disponible" }
            case "out_of_stock":
              return { success: false, error: "Este producto está agotado" }
            default:
              return { success: false, error: "No se pudo agregar al carrito" }
          }
        }
      }

      const cartId = product.variant_id || product.id

      setItems((prev) => {
        const existing = prev.find((i) => (i.variant_id || i.id) === cartId)
        if (existing) {
          return prev.map((i) =>
            (i.variant_id || i.id) === cartId ? { ...i, quantity: i.quantity + (product.quantity || 1) } : i
          )
        }
        return [...prev, { ...product, quantity: product.quantity || 1, price_snapshot: product.price }]
      })

      const newStatuses = new Map(itemStatuses)
      const validatedItem = result.items[0]
      if (validatedItem && validatedItem.status === "valid") {
        newStatuses.set(cartId, { status: "valid" })
        setItemStatuses(newStatuses)
      }

      return { success: true }
    } catch (error) {
      console.error("Add to cart error:", error)
      return { success: false, error: "Error al validar el producto" }
    }
  }, [validateItem, itemStatuses])

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const newStatuses = new Map(itemStatuses)
    newStatuses.delete(id)
    setItemStatuses(newStatuses)
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const clearCart = () => {
    setItems([])
    setItemStatuses(new Map())
  }

  const total = items.reduce((acc, current) => {
    const status = itemStatuses.get(current.variant_id || current.id)
    if (status && status.status === "valid" && status.current_price) {
      return acc + status.current_price * current.quantity
    }
    return acc + current.price * current.quantity
  }, 0)

  const hasBlockedItems = Array.from(itemStatuses.values()).some(
    (s) => s.status !== "valid" && s.status !== "price_changed"
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemStatuses,
        isValidating,
        revalidateCart,
        hasBlockedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}