"use client"

import { useMemo } from "react"
import type { CartItem, ItemStatus } from "@/types/cart.types"
import { formatPrice } from "@/lib/format"

type OrderSummaryProps = {
  items: CartItem[]
  total: number
  shippingCost: number
  selectedZone: { name: string } | null
  itemStatuses: Map<string, ItemStatus>
}

export function OrderSummary({ items, total, shippingCost, selectedZone, itemStatuses }: OrderSummaryProps) {
  const grandTotal = useMemo(() => total + shippingCost, [total, shippingCost])

  return (
    <>
      <h2 className="text-xl font-bold text-card-foreground mb-6">Resumen del Pedido</h2>
      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const statusKey = item.variant_id || item.id
          const status = itemStatuses.get(statusKey)
          const isBlocked = status && status.status !== "valid" && status.status !== "price_changed"
          const hasPriceChange =
            status?.original_price && status?.current_price && status.original_price !== status.current_price

          return (
            <div
              key={item.id}
              className={`flex justify-between items-center text-sm ${isBlocked ? "opacity-50 line-through" : ""}`}
            >
              <span className="font-medium text-foreground">
                {item.name} x {item.quantity}
                {item.sku_code && <span className="text-xs ml-2 text-muted-foreground/70">({item.sku_code})</span>}
                {hasPriceChange && (
                  <span className="ml-2 text-amber-600 text-xs">
                    {status?.price_increased ? "▲" : "▼"} precio
                  </span>
                )}
              </span>
              <span className="font-semibold text-foreground font-mono text-xs">
                {formatPrice((status?.current_price || item.price) * item.quantity)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center mb-2 text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between items-center mb-2 text-sm">
        <span className="text-muted-foreground">Envío {selectedZone ? `a ${selectedZone.name}` : ""}</span>
        <span className={shippingCost === 0 && selectedZone ? "text-success font-semibold" : "text-foreground"}>
          {!selectedZone ? (
            <span className="text-muted-foreground italic">Selecciona una ciudad</span>
          ) : shippingCost === 0 ? (
            "Gratis"
          ) : (
            formatPrice(shippingCost)
          )}
        </span>
      </div>

      <hr className="border-border mb-5" />

      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-extrabold text-card-foreground">Total</span>
        <span className="text-lg font-extrabold text-primary">{formatPrice(grandTotal)}</span>
      </div>
    </>
  )
}
