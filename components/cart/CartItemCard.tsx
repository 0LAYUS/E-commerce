"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUS_BADGE_CONFIG, STATUS_MESSAGES } from "@/lib/constants/cart"
import { formatPrice } from "@/lib/format"
import type { CartItem } from "@/types/cart.types"
import type { ItemStatus } from "@/types/cart.types"

type CartItemCardProps = {
  item: CartItem
  statusInfo: ItemStatus | undefined
  isBlocked: boolean
  isPriceChanged: boolean
  hasPriceChange: boolean
  onDecrement: (id: string, currentQty: number) => void
  onIncrement: (id: string, currentQty: number) => void
  onRemove: (id: string, name: string) => void
}

export default function CartItemCard({
  item,
  statusInfo,
  isBlocked,
  isPriceChanged,
  hasPriceChange,
  onDecrement,
  onIncrement,
  onRemove,
}: CartItemCardProps) {
  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE_CONFIG[status]
    if (!config) return null
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const getStatusMessage = (status: string, itemName: string, availableStock?: number) => {
    const fn = STATUS_MESSAGES[status]
    return fn ? fn(itemName, availableStock) : null
  }

  return (
    <div
      className={`relative flex p-4 bg-card rounded-xl shadow-sm border items-center ${
        isBlocked ? "opacity-60" : ""
      }`}
    >
      {statusInfo && (
        <div className="absolute top-2 right-2 flex gap-2">
          {getStatusBadge(statusInfo.status)}
          {hasPriceChange && (
            <Badge variant="outline" className="text-xs">
              Precio actualizado
            </Badge>
          )}
        </div>
      )}

      <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-contain" sizes="96px" />
        ) : (
          <div className="text-xs text-muted-foreground">IMG</div>
        )}
      </div>

      <div className="ml-6 flex-1 flex flex-col justify-center">
        <h3 className={`text-lg font-bold text-card-foreground ${isBlocked ? "line-through" : ""}`}>
          {item.name}
        </h3>
        {item.sku_code && (
          <p className="text-xs text-muted-foreground font-mono mb-1">{item.sku_code}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {hasPriceChange ? (
            <>
              <span className="text-lg font-bold text-muted-foreground line-through">
                {formatPrice(statusInfo?.original_price || 0)}
              </span>
              <span className={`text-lg font-bold ${statusInfo?.price_increased ? "text-[var(--color-destructive)]" : "text-[var(--color-success)]"}`}>
                {formatPrice(statusInfo?.current_price || 0)}
              </span>
            </>
          ) : (
            <span
              className={`text-lg font-bold ${
                isBlocked ? "text-muted-foreground line-through" : "text-primary"
              }`}
            >
              {formatPrice(item.price)}
            </span>
          )}
          {isPriceChanged && statusInfo?.available_stock && (
            <span className="text-sm text-[var(--color-warning)] bg-[var(--bg-warning)] px-2 py-0.5 rounded">
              Stock: {statusInfo.available_stock}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between self-stretch">
        <button
          onClick={() => onRemove(item.id, item.name)}
          className="text-destructive hover:text-destructive/80 p-1 mb-auto transition"
          title="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {isBlocked ? (
          <div className="text-sm text-destructive font-medium">No disponible</div>
        ) : (
          <div className="flex items-center space-x-3 mt-auto">
            <button
              onClick={() => onDecrement(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-foreground w-4 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onIncrement(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {statusInfo && statusInfo.status === "variant_inactive" && (
        <div className="absolute bottom-2 left-4 right-4">
          <p className="text-xs text-muted-foreground">
            Esta variante ya no está disponible. Puedes ver otras variantes activas en la página del producto.
          </p>
          <Link
            href={`/products/${item.product_id}`}
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            Ver alternativas
          </Link>
        </div>
      )}

      {statusInfo && statusInfo.status !== "valid" && statusInfo.status !== "variant_inactive" && (
        <div className="absolute bottom-2 left-4 right-4">
          <p className="text-xs text-destructive">
            {getStatusMessage(statusInfo.status, item.name, statusInfo.available_stock)}
          </p>
        </div>
      )}
    </div>
  )
}
