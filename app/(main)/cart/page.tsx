"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/components/providers/CartProvider"
import Link from "next/link"
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ConfirmDialog } from "@/components/ui/modal"
import CartItemCard from "@/components/cart/CartItemCard"
import CartSummary from "@/components/cart/CartSummary"
import { useCartPriceChanges } from "@/hooks/useCartPriceChanges"
import { formatPrice } from "@/lib/format"

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    total,
    itemStatuses,
    isValidating,
    revalidateCart,
    hasBlockedItems,
  } = useCart()

  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)
  const priceChangedItems = useCartPriceChanges(itemStatuses, items)

  useEffect(() => {
    revalidateCart()
  }, [revalidateCart])

  const handleDecrement = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty - 1)
  }

  const handleIncrement = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty + 1)
  }

  const getItemStatusInfo = (itemId: string, variantId?: string) => {
    const statusKey = variantId || itemId
    return itemStatuses.get(statusKey)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl shadow-sm border mt-10">
        <h2 className="text-2xl font-bold text-card-foreground">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mt-2">Parece que no has agregado nada todavía.</p>
        <Link href="/" className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const problemItems = items.filter((item) => {
    const status = getItemStatusInfo(item.id, item.variant_id)
    return status && status.status !== "valid"
  })

  const blockedItemsCount = problemItems.filter((item) => {
    const status = getItemStatusInfo(item.id, item.variant_id)
    return status?.status !== "price_changed"
  }).length

  return (
    <div className="mt-8 mb-16 min-h-[calc(100vh-12rem)] px-4 sm:px-6 lg:px-12">
      <h1 className="text-3xl font-extrabold text-foreground mb-8">Mi Carrito</h1>

      {isValidating && (
        <Alert className="mb-6 bg-info-muted border-info/30">
          <Info className="h-4 w-4 text-info" />
          <AlertTitle className="text-info">Validando carrito...</AlertTitle>
          <AlertDescription className="text-info">
            Verificando disponibilidad de productos.
          </AlertDescription>
        </Alert>
      )}

      {priceChangedItems.length > 0 && (
        <Alert className="mb-6 bg-warning-muted border-warning/30">
          <TrendingUp className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Precios actualizados</AlertTitle>
          <AlertDescription className="text-warning">
            <ul className="mt-2 space-y-1">
              {priceChangedItems.map((change, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-medium">{change.name}</span>
                  <span className="text-sm">
                    {formatPrice(change.oldPrice)}
                    {change.increased ? (
                      <TrendingUp className="inline w-3 h-3 mx-1 text-destructive" />
                    ) : (
                      <TrendingDown className="inline w-3 h-3 mx-1 text-success" />
                    )}
                    {formatPrice(change.newPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {blockedItemsCount > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Algunos productos tienen problemas</AlertTitle>
          <AlertDescription>
            {blockedItemsCount === 1
              ? "1 producto en tu carrito no está disponible."
              : `${blockedItemsCount} productos en tu carrito no están disponibles.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-4">
          {items.map((item) => {
            const statusInfo = getItemStatusInfo(item.id, item.variant_id)
            const isBlocked = statusInfo && statusInfo.status !== "valid" && statusInfo.status !== "price_changed"
            const isPriceChanged = statusInfo?.status === "price_changed"
            const hasPriceChange = statusInfo?.original_price && statusInfo?.current_price && statusInfo.original_price !== statusInfo.current_price

            return (
              <CartItemCard
                key={item.id}
                item={item}
                statusInfo={statusInfo}
                isBlocked={!!isBlocked}
                isPriceChanged={!!isPriceChanged}
                hasPriceChange={!!hasPriceChange}
                onDecrement={handleDecrement}
                onIncrement={handleIncrement}
                onRemove={(id, name) => setItemToRemove({ id, name })}
              />
            )
          })}
        </div>

        <CartSummary total={total} hasBlockedItems={hasBlockedItems} />
      </div>

      <ConfirmDialog
        open={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          if (itemToRemove) {
            removeFromCart(itemToRemove.id)
          }
        }}
        title="Eliminar del carrito"
        description={
          itemToRemove
            ? `¿Estás seguro de que quieres eliminar "${itemToRemove.name}" del carrito?`
            : undefined
        }
        confirmText="Eliminar"
        cancelText="Conservar"
        destructive
      />
    </div>
  )
}
