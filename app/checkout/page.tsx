"use client"

import { useCart } from "@/components/providers/CartProvider"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrder } from "@/lib/actions/checkoutActions"
import { getWompiIntegritySignature } from "@/lib/actions/wompiActions"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { useCheckoutSetup } from "@/hooks/useCheckoutSetup"
import { useStockReservation } from "@/hooks/useStockReservation"
import { ShippingInfoForm } from "@/components/checkout/ShippingInfoForm"
import { OrderSummary } from "@/components/checkout/OrderSummary"
import { BlockedItemsAlert } from "@/components/checkout/BlockedItemsAlert"
import { PriceChangeAlert } from "@/components/checkout/PriceChangeAlert"
import { wompiPublicKey, wompiWidgetDefaults } from "@/lib/constants/checkout"
import type { WompiResult } from "@/types/checkout.types"

export default function CheckoutPage() {
  const { items, total, clearCart, revalidateCart, hasBlockedItems, itemStatuses } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const { zones, nombre, email, direccion, setNombre, setDireccion } = useCheckoutSetup()

  const { reservationId, reservationExpiresAt, reserveStock, cancelReservation } = useStockReservation(
    items,
    hasBlockedItems
  )

  useEffect(() => {
    const validateBeforeCheckout = async () => {
      setIsValidating(true)
      await revalidateCart()
      setIsValidating(false)
    }
    validateBeforeCheckout()
  }, [revalidateCart])

  useEffect(() => {
    if (items.length > 0 && !hasBlockedItems) {
      reserveStock(
        items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }))
      )
    }
  }, [items, hasBlockedItems, reserveStock])

  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId) || null, [zones, selectedZoneId])

  const shippingCost = useMemo(() => {
    if (!selectedZone) return 0
    if (selectedZone.free_threshold > 0 && total >= selectedZone.free_threshold) return 0
    return selectedZone.cost
  }, [selectedZone, total])

  const grandTotal = useMemo(() => total + shippingCost, [total, shippingCost])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasBlockedItems) {
      setError("Hay productos en tu carrito que no están disponibles. Por favor, revisa tu carrito.")
      return
    }

    if (!selectedZoneId) {
      setError("Por favor selecciona una ciudad de envío.")
      return
    }

    if (items.length === 0) return

    setLoading(true)
    setError("")
    try {
      const orderId = await createOrder(
        items.map((i) => ({
          id: i.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        total,
        nombre,
        direccion,
        shippingCost,
        selectedZoneId || undefined
      )

      const amountInCents = Math.round(grandTotal) * 100
      const integritySignature = await getWompiIntegritySignature(orderId, amountInCents, "COP")

      const widgetConfig: Record<string, unknown> = {
        currency: wompiWidgetDefaults.currency,
        amountInCents,
        reference: orderId,
        publicKey: wompiPublicKey,
        redirectUrl: wompiWidgetDefaults.redirectUrl,
        customerData: {
          email: email,
          fullName: nombre,
        },
      }

      if (integritySignature) {
        widgetConfig.signature = { integrity: integritySignature }
      }

      const checkout = new (window as any).WidgetCheckout(widgetConfig)

      checkout.open(async (result: WompiResult) => {
        const transaction = result.transaction

        if (transaction.status === "APPROVED" && reservationId) {
          await fetch("/api/cart/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservation_id: reservationId }),
          }).catch(console.error)
          clearCart()
        } else if (reservationId && transaction.status !== "APPROVED") {
          await fetch("/api/cart/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservation_id: reservationId }),
          }).catch(console.error)
        }

        router.push(`/checkout/result?id=${transaction.id}&status=${transaction.status}`)
      })
    } catch (err: unknown) {
      if (reservationId) {
        cancelReservation()
      }
      const messageText = err instanceof Error ? err.message : "Error al procesar. Verifica tu sesión."
      setError(messageText)
    } finally {
      setLoading(false)
    }
  }

  const problemItems = items.filter((item) => {
    const statusKey = item.variant_id || item.id
    const status = itemStatuses.get(statusKey)
    return status && status.status !== "valid"
  })

  const blockedItems = problemItems.filter((item) => {
    const statusKey = item.variant_id || item.id
    const status = itemStatuses.get(statusKey)
    return status?.status !== "price_changed"
  })

  const priceChangedItems = items.filter((item) => {
    const statusKey = item.variant_id || item.id
    const status = itemStatuses.get(statusKey)
    return status?.original_price && status?.current_price && status.original_price !== status.current_price
  })

  if (items.length === 0) {
    return (
      <div className="text-center mt-20 text-muted-foreground">
        Tu carrito está vacío.{" "}
        <Link href="/" className="text-primary font-medium hover:underline">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 mb-20 px-4 sm:px-6 lg:px-80">
      <h1 className="text-3xl font-extrabold mb-8 text-foreground">Checkout</h1>

      {reservationExpiresAt && (
        <Alert className="mb-6 bg-success-muted border-success/30">
          <Clock className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Stock reservado</AlertTitle>
          <AlertDescription className="text-success/80">
            Tu stock está reservado por 15 minutos. Completa el pago antes de que expire.
          </AlertDescription>
        </Alert>
      )}

      {isValidating && (
        <Alert className="mb-6 bg-info-muted border-info/30">
          <AlertTitle className="text-info">Validando disponibilidad...</AlertTitle>
          <AlertDescription className="text-info/80">
            Verificando stock de todos los productos antes de proceder.
          </AlertDescription>
        </Alert>
      )}

      {blockedItems.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No puedes proceder al pago</AlertTitle>
          <AlertDescription>
            Algunos productos en tu carrito no están disponibles.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card shadow-sm border rounded-xl overflow-hidden p-8">
        <BlockedItemsAlert blockedItems={blockedItems} itemStatuses={itemStatuses} />
        <PriceChangeAlert priceChangedItems={priceChangedItems} itemStatuses={itemStatuses} />

        <form onSubmit={handlePayment}>
          <ShippingInfoForm
            zones={zones}
            nombre={nombre}
            email={email}
            direccion={direccion}
            selectedZoneId={selectedZoneId}
            onNombreChange={setNombre}
            onDireccionChange={setDireccion}
            onZoneChange={setSelectedZoneId}
          />

          <OrderSummary
            items={items}
            total={total}
            shippingCost={shippingCost}
            selectedZone={selectedZone}
            itemStatuses={itemStatuses}
          />

          {error && <div className="mb-4 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading || hasBlockedItems || isValidating || !selectedZoneId}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm mt-2"
          >
            {loading || isValidating ? "Verificando stock..." : !selectedZoneId ? "Selecciona una ciudad" : "Proceder al Pago"}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Serás redirigido a Wompi para completar tu pago de forma segura.
          </p>
        </form>
      </div>
    </div>
  )
}
