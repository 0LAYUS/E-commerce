"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/components/providers/CartProvider"
import Link from "next/link"
import { Trash2, Minus, Plus, AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/modal"

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

  const [priceChangedItems, setPriceChangedItems] = useState<Array<{ name: string; oldPrice: number; newPrice: number; increased: boolean }>>([])
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    revalidateCart()
  }, [revalidateCart])

  useEffect(() => {
    const changes: Array<{ name: string; oldPrice: number; newPrice: number; increased: boolean }> = []
    itemStatuses.forEach((status, key) => {
      if (status.original_price && status.current_price && status.original_price !== status.current_price) {
        const item = items.find(i => (i.variant_id || i.id) === key)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "product_inactive":
        return (
          <Badge variant="destructive" className="text-xs">
            Producto no disponible
          </Badge>
        )
      case "variant_inactive":
        return (
          <Badge variant="destructive" className="text-xs">
            Variante no disponible
          </Badge>
        )
      case "out_of_stock":
        return (
          <Badge variant="destructive" className="text-xs">
            Agotado
          </Badge>
        )
      case "price_changed":
        return (
          <Badge variant="warning" className="text-xs">
            Stock reducido
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusMessage = (status: string, itemName: string, availableStock?: number) => {
    switch (status) {
      case "product_inactive":
        return `El producto "${itemName}" ya no está disponible y fue removido del inventario.`
      case "variant_inactive":
        return `La variante de "${itemName}" ya no está disponible. Puede que otras tallas o colores sigan activas.`
      case "out_of_stock":
        return `El producto "${itemName}" está agotado y no puede ser purchased.`
      case "price_changed":
        return `El stock para "${itemName}" se redujo a ${availableStock} unidades. La cantidad fue ajustada automáticamente.`
      default:
        return null
    }
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
    <div className="mt-4 px-4 sm:px-6 lg:px-12">
      <h1 className="text-3xl font-extrabold text-foreground mb-8">Mi Carrito</h1>

      {isValidating && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Validando carrito...</AlertTitle>
          <AlertDescription className="text-blue-600">
            Verificando disponibilidad de productos.
          </AlertDescription>
        </Alert>
      )}

      {priceChangedItems.length > 0 && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Precios actualizados</AlertTitle>
          <AlertDescription className="text-amber-700">
            <ul className="mt-2 space-y-1">
              {priceChangedItems.map((change, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-medium">{change.name}</span>
                  <span className="text-sm">
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(change.oldPrice)}
                    {change.increased ? (
                      <TrendingUp className="inline w-3 h-3 mx-1 text-red-500" />
                    ) : (
                      <TrendingDown className="inline w-3 h-3 mx-1 text-green-500" />
                    )}
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(change.newPrice)}
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
              <div
                key={item.id}
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

                <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
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
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(statusInfo?.original_price || 0)}
                        </span>
                        <span className={`text-lg font-bold ${statusInfo?.price_increased ? "text-red-600" : "text-green-600"}`}>
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(statusInfo?.current_price || 0)}
                        </span>
                      </>
                    ) : (
                      <span
                        className={`text-lg font-bold ${
                          isBlocked ? "text-muted-foreground line-through" : "text-primary"
                        }`}
                      >
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(item.price)}
                      </span>
                    )}
                    {isPriceChanged && statusInfo?.available_stock && (
                      <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Stock: {statusInfo.available_stock}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch">
                  <button
                    onClick={() => setItemToRemove({ id: item.id, name: item.name })}
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
                        onClick={() => handleDecrement(item.id, item.quantity)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-base font-bold text-foreground w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.id, item.quantity)}
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
          })}
        </div>

        <div className="w-full lg:w-1/3 bg-card rounded-xl shadow-sm border p-6 sticky top-24">
          <h2 className="text-xl font-extrabold text-card-foreground mb-6">Resumen</h2>

          <div className="flex justify-between items-center mb-4 text-muted-foreground font-medium">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(total)}</span>
          </div>

          <hr className="my-4 border-border" />

          <div className="flex justify-between items-center mb-8">
            <span className="text-lg font-extrabold text-card-foreground">Total</span>
            <span className="text-lg font-extrabold text-primary">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          {hasBlockedItems ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">
                No puedes proceder al pago mientras haya productos no disponibles.
              </p>
              <Button disabled className="w-full">
                Proceder al Pago
              </Button>
              <Link
                href="/"
                className="block w-full text-center bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90 transition shadow-sm"
              >
                Volver a la tienda
              </Link>
            </div>
          ) : (
            <Link
              href="/checkout"
              className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              Proceder al Pago
            </Link>
          )}
        </div>
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