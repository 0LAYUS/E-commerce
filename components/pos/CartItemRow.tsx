"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { CartItem } from "@/types/pos.types"

type CartItemRowProps = {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  return (
    <div className="py-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-card-foreground truncate">
            {item.name}
          </h4>
          {item.sku && (
            <p className="text-xs text-muted-foreground font-mono">
              {item.sku}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatPrice(item.unit_price)} c/u
            {item.discount_pct > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                -{item.discount_pct}%
              </span>
            )}
            {item.bogo_applied && (
              <span className="ml-2 bg-warning-muted text-warning text-xs px-1 rounded">
                2x1
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            className="w-8 h-8 flex items-center justify-center border border-input rounded-lg hover:bg-accent transition"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
            disabled={item.quantity >= item.stock}
            className="w-8 h-8 flex items-center justify-center border border-input rounded-lg hover:bg-accent transition disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="text-right">
          <p className="font-bold text-card-foreground">
            {formatPrice(item.subtotal)}
          </p>
          {item.discount_pct > 0 && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(item.unit_price * item.quantity)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
