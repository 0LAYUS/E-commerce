"use client"

import Link from "next/link"
import type { CartItem, ItemStatus } from "@/features/cart/types/cart.types"

type BlockedItemsAlertProps = {
  blockedItems: CartItem[]
  itemStatuses: Map<string, ItemStatus>
}

export function BlockedItemsAlert({ blockedItems, itemStatuses }: BlockedItemsAlertProps) {
  if (blockedItems.length === 0) return null

  return (
    <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
      <h3 className="font-semibold text-destructive mb-3">Productos con problemas:</h3>
      <ul className="space-y-2">
        {blockedItems.map((item) => {
          const statusKey = item.variant_id || item.id
          const status = itemStatuses.get(statusKey)
          return (
            <li key={item.id} className="text-sm">
              <span className="font-medium text-foreground">{item.name}</span>
              {item.sku_code && <span className="text-muted-foreground ml-1">({item.sku_code})</span>}
              <span className="text-destructive ml-2">
                {status?.status === "product_inactive" && "- Producto no disponible"}
                {status?.status === "variant_inactive" && "- Variante no disponible"}
                {status?.status === "out_of_stock" && "- Agotado"}
              </span>
            </li>
          )
        })}
      </ul>
      <Link href="/cart" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Ir al carrito para resolver
      </Link>
    </div>
  )
}
