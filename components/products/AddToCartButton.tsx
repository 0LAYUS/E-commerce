"use client"

import { useState } from "react"
import { useCart } from "@/components/providers/CartProvider"
import type { CartItem } from "@/types/cart.types"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Props = {
  productId: string
  productName: string
  price: number
  imageUrl?: string
  stock: number
  variantId?: string
  skuCode?: string
}

export default function AddToCartButton({
  productId,
  productName,
  price,
  imageUrl,
  stock,
  variantId,
  skuCode,
}: Props) {
  const { addItem } = useCart()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await addItem({
        id: variantId || productId,
        product_id: productId,
        variant_id: variantId,
        name: productName,
        price,
        imageUrl,
        sku_code: skuCode,
      })
      if (!result.success && result.error) {
        setError(result.error)
        setTimeout(() => setError(null), 4000)
      }
    } finally {
      setLoading(false)
    }
  }

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full bg-muted text-muted-foreground py-4 rounded-xl font-bold text-lg cursor-not-allowed"
      >
        Agotado
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition shadow-sm"
      >
        {loading ? "Agregando..." : "Añadir al carrito"}
      </button>
    </div>
  )
}