"use client"

import { useCart } from "@/components/providers/CartProvider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createOrder } from "@/lib/actions/checkoutActions"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const { items, total, clearCart, revalidateCart, hasBlockedItems, itemStatuses } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [reservationExpiresAt, setReservationExpiresAt] = useState<Date | null>(null)

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [direccion, setDireccion] = useState("")

  const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_test_wompi_key_placeholder"

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.wompi.co/widget.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    const validateBeforeCheckout = async () => {
      setIsValidating(true)
      await revalidateCart()
      setIsValidating(false)
    }
    validateBeforeCheckout()
  }, [revalidateCart])

  useEffect(() => {
    const reserveStock = async () => {
      if (items.length === 0 || hasBlockedItems) return

      try {
        const response = await fetch("/api/cart/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            })),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setReservationId(data.reservation_id)
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
          setReservationExpiresAt(expiresAt)
        }
      } catch (err) {
        console.error("Failed to reserve stock:", err)
      }
    }

    reserveStock()
  }, [items, hasBlockedItems])

  useEffect(() => {
    if (!reservationExpiresAt) return

    const cleanup = () => {
      if (reservationId) {
        fetch("/api/cart/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservation_id: reservationId }),
        }).catch(console.error)
      }
    }

    window.addEventListener("beforeunload", cleanup)
    return () => window.removeEventListener("beforeunload", cleanup)
  }, [reservationExpiresAt, reservationId])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasBlockedItems) {
      setError("Hay productos en tu carrito que no están disponibles. Por favor, revisa tu carrito.")
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
          price: i.price,
        })),
        total,
        nombre,
        email,
        direccion
      )

      const checkout = new (window as any).WidgetCheckout({
        currency: "COP",
        amountInCents: total * 100,
        reference: orderId,
        publicKey: wompiPublicKey,
        redirectUrl: `${window.location.origin}/checkout/result`,
        customerData: {
          email: email,
          fullName: nombre,
        },
      })

      checkout.open(async (result: any) => {
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
    } catch (err: any) {
      if (reservationId) {
        fetch("/api/cart/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservation_id: reservationId }),
        }).catch(console.error)
      }
      setError(err.message || "Error al procesar. Verifica tu sesión.")
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
        <Link href="/" className="text-primary font-medium hover:underline">Volver a la tienda</Link>
      </div>
    )
  }

  return (
    <div className="mt-8 mb-20 px-4 sm:px-6 lg:px-12">
      <h1 className="text-3xl font-extrabold mb-8 text-foreground">Checkout</h1>

      {reservationExpiresAt && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Stock reservado</AlertTitle>
          <AlertDescription className="text-green-600">
            Tu stock está reservado por 15 minutos. Completa el pago antes de que expire.
          </AlertDescription>
        </Alert>
      )}

      {isValidating && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">Validando disponibilidad...</AlertTitle>
          <AlertDescription className="text-blue-600">
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
        {blockedItems.length > 0 && (
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
            <Link
              href="/cart"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Ir al carrito para resolver
            </Link>
          </div>
        )}

        {priceChangedItems.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Precios actualizados
            </h3>
            <ul className="space-y-2">
              {priceChangedItems.map((item) => {
                const statusKey = item.variant_id || item.id
                const status = itemStatuses.get(statusKey)
                return (
                  <li key={item.id} className="text-sm flex items-center justify-between">
                    <span className="text-amber-900">
                      <span className="font-medium">{item.name}</span>
                      {item.sku_code && <span className="text-muted-foreground ml-1">({item.sku_code})</span>}
                    </span>
                    <span className="flex items-center gap-2 text-amber-700">
                      <span className="line-through">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(status?.original_price || 0)}</span>
                      {status?.price_increased ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-green-500" />}
                      <span className="font-semibold">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(status?.current_price || 0)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <form onSubmit={handlePayment}>
          <h2 className="text-xl font-bold text-card-foreground mb-6">Información de Envío</h2>

          <div className="space-y-5 mb-10">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="juan@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1">Dirección de Envío</label>
              <textarea
                rows={3}
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Calle, ciudad, código postal, país"
              ></textarea>
            </div>
          </div>

          <h2 className="text-xl font-bold text-card-foreground mb-6">Resumen del Pedido</h2>
          <div className="space-y-3 mb-6">
            {items.map((item) => {
              const statusKey = item.variant_id || item.id
              const status = itemStatuses.get(statusKey)
              const isBlocked = status && status.status !== "valid" && status.status !== "price_changed"
              const hasPriceChange = status?.original_price && status?.current_price && status.original_price !== status.current_price

              return (
                <div
                  key={item.id}
                  className={`flex justify-between items-center text-sm ${
                    isBlocked ? "opacity-50 line-through" : ""
                  }`}
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
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format((status?.current_price || item.price) * item.quantity)}
                  </span>
                </div>
              )
            })}
          </div>

          <hr className="border-border mb-5" />

          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-extrabold text-card-foreground">Total</span>
            <span className="text-lg font-extrabold text-primary">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          {error && (
            <div className="mb-4 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || hasBlockedItems || isValidating}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm mt-2"
          >
            {loading || isValidating ? "Verificando stock..." : "Proceder al Pago"}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Serás redirigido a Wompi para completar tu pago de forma segura.
          </p>
        </form>
      </div>
    </div>
  )
}