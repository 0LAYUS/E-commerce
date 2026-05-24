"use client"

import type { CartItem, ItemStatus } from "@/features/cart/types/cart.types"
import { formatPrice } from "@/lib/format"
import { TrendingUp, TrendingDown } from "lucide-react"

type PriceChangeAlertProps = {
  priceChangedItems: CartItem[]
  itemStatuses: Map<string, ItemStatus>
}

export function PriceChangeAlert({ priceChangedItems, itemStatuses }: PriceChangeAlertProps) {
  if (priceChangedItems.length === 0) return null

  return (
    <div className="mb-6 p-4 bg-warning-muted border border-warning/20 rounded-lg">
      <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Precios actualizados
      </h3>
      <ul className="space-y-2">
        {priceChangedItems.map((item) => {
          const statusKey = item.variant_id || item.id
          const status = itemStatuses.get(statusKey)
          return (
            <li key={item.id} className="text-sm flex items-center justify-between">
              <span className="text-warning-foreground">
                <span className="font-medium">{item.name}</span>
                {item.sku_code && <span className="text-muted-foreground ml-1">({item.sku_code})</span>}
              </span>
              <span className="flex items-center gap-2 text-warning-foreground/80">
                <span className="line-through">{formatPrice(status?.original_price || 0)}</span>
                {status?.price_increased ? (
                  <TrendingUp className="w-3 h-3 text-destructive" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-success" />
                )}
                <span className="font-semibold">{formatPrice(status?.current_price || 0)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
