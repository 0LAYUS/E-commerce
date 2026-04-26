"use client"

import { useState, useCallback } from "react"
import { useCart } from "@/components/providers/CartProvider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

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
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(Math.max(1, Math.min(value, stock)))
  }, [stock])

  const handleAddToCart = useCallback(async () => {
    if (stock === 0) return

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
      } else {
        setQuantity(1)
      }
    } finally {
      setLoading(false)
    }
  }, [addItem, productId, variantId, productName, price, imageUrl, skuCode, quantity, stock])

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
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Cantidad:</label>
        <Input
          type="number"
          min={1}
          max={stock}
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
          className="w-20 text-center"
        />
        <span className="text-sm text-muted-foreground">de {stock} disponibles</span>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      ) : null}
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