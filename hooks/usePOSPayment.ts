"use client"

import { useState, useCallback } from "react"
import type { CartItem, SaleResponse } from "@/types/pos.types"

type UsePOSPaymentReturn = {
  isPaymentOpen: boolean
  isReceiptOpen: boolean
  lastSale: SaleResponse | null
  handlePaymentConfirm: (
    method: string,
    amountReceived?: number,
    changeAmount?: number,
    payments?: { method: string; amount: number }[]
  ) => Promise<void>
  handleNewSale: () => void
  setIsPaymentOpen: (open: boolean) => void
  setIsReceiptOpen: (open: boolean) => void
}

export function usePOSPayment(
  cart: CartItem[],
  customerName: string,
  discountAmount: number,
  discountPct: number,
  subtotal: number,
  total: number,
  onClearCart: () => void
): UsePOSPaymentReturn {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null)

  const handlePaymentConfirm = useCallback(
    async (
      method: string,
      amountReceived?: number,
      changeAmount?: number,
      payments?: { method: string; amount: number }[]
    ) => {
      try {
        const saleData = {
          customer_name: customerName || null,
          items: cart.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct,
            subtotal: item.subtotal,
          })),
          discount_amount: discountAmount,
          discount_reason: discountPct > 0 ? `Descuento ${discountPct}%` : null,
          subtotal,
          total,
          payment_method: method,
          amount_received: amountReceived,
          change_amount: changeAmount,
          payments,
          notes: null,
        }

        const res = await fetch("/api/pos/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleData),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Error al procesar la venta")
        }

        setLastSale({
          ...data.sale,
          items: cart,
        })
        setIsPaymentOpen(false)
        setIsReceiptOpen(true)
      } catch (err) {
        alert((err as Error).message || "Error al procesar la venta")
      }
    },
    [cart, customerName, discountAmount, discountPct, subtotal, total]
  )

  const handleNewSale = useCallback(() => {
    setIsReceiptOpen(false)
    setLastSale(null)
    onClearCart()
  }, [onClearCart])

  return {
    isPaymentOpen,
    isReceiptOpen,
    lastSale,
    handlePaymentConfirm,
    handleNewSale,
    setIsPaymentOpen,
    setIsReceiptOpen,
  }
}
