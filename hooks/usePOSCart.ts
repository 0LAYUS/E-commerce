"use client"

import { useState, useCallback } from "react"
import type { POSProduct } from "@/types/product.types"
import type { CartItem } from "@/types/pos.types"

type UsePOSCartReturn = {
  cart: CartItem[]
  customerName: string
  discountPct: number
  subtotal: number
  discountAmount: number
  total: number
  handleSelectProduct: (product: POSProduct) => void
  handleSelectVariant: (product: POSProduct, variant: POSProduct["variants"][0]) => void
  handleUpdateQuantity: (id: string, quantity: number) => void
  handleRemoveItem: (id: string) => void
  handleApplyDiscount: (discount: number) => void
  handleClearCart: () => void
  setCustomerName: (name: string) => void
}

export function usePOSCart(): UsePOSCartReturn {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [discountPct, setDiscountPct] = useState(0)

  const handleSelectProduct = useCallback((product: POSProduct) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.product_id === product.id && item.variant_id === null
      )

      if (existingItem) {
        if (existingItem.quantity < existingItem.stock) {
          return prev.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.unit_price * (1 - item.discount_pct / 100),
                }
              : item
          )
        }
        return prev
      }

      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: null,
        name: product.name,
        sku: null,
        quantity: 1,
        unit_price: product.price,
        discount_pct: 0,
        subtotal: product.price,
        stock: product.stock,
      }
      return [...prev, newItem]
    })
  }, [])

  const handleSelectVariant = useCallback((product: POSProduct, variant: POSProduct["variants"][0]) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.variant_id === variant.id)

      if (existingItem) {
        if (existingItem.quantity < variant.stock) {
          return prev.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.unit_price * (1 - item.discount_pct / 100),
                }
              : item
          )
        }
        return prev
      }

      const price = variant.price_override || product.price
      const newItem: CartItem = {
        id: `${variant.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: variant.id,
        name: product.name,
        sku: variant.sku_code,
        quantity: 1,
        unit_price: price,
        discount_pct: 0,
        subtotal: price,
        stock: variant.stock,
      }
      return [...prev, newItem]
    })
  }, [])

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unit_price * (1 - item.discount_pct / 100),
            }
          : item
      )
    )
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleApplyDiscount = useCallback((discount: number) => {
    setDiscountPct(discount)
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        discount_pct: discount,
        subtotal: item.quantity * item.unit_price * (1 - discount / 100),
      }))
    )
  }, [])

  const handleClearCart = useCallback(() => {
    setCart([])
    setCustomerName("")
    setDiscountPct(0)
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const discountAmount = subtotal * (discountPct / 100)
  const total = subtotal - discountAmount

  return {
    cart,
    customerName,
    discountPct,
    subtotal,
    discountAmount,
    total,
    handleSelectProduct,
    handleSelectVariant,
    handleUpdateQuantity,
    handleRemoveItem,
    handleApplyDiscount,
    handleClearCart,
    setCustomerName,
  }
}
