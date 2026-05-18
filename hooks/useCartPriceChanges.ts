"use client"

import { useEffect, useState } from "react"
import type { CartItem } from "@/types/cart.types"

type PriceChange = {
  name: string
  oldPrice: number
  newPrice: number
  increased: boolean
}

export function useCartPriceChanges(
  itemStatuses: Map<string, { original_price?: number; current_price?: number; price_increased?: boolean }>,
  items: CartItem[]
) {
  const [priceChangedItems, setPriceChangedItems] = useState<PriceChange[]>([])

  useEffect(() => {
    const changes: PriceChange[] = []
    itemStatuses.forEach((status, key) => {
      if (status.original_price && status.current_price && status.original_price !== status.current_price) {
        const item = items.find((i) => (i.variant_id || i.id) === key)
        if (item) {
          changes.push({
            name: item.name,
            oldPrice: status.original_price,
            newPrice: status.current_price!,
            increased: status.price_increased || false,
          })
        }
      }
    })
    setPriceChangedItems(changes)
  }, [itemStatuses, items])

  return priceChangedItems
}
