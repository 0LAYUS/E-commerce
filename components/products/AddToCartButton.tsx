"use client"

import { useCart } from "@/components/providers/CartProvider"
import type { CartItem } from "@/types/cart.types"

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

  const handleAddToCart = () => {
    addItem({
      id: variantId || productId,
      product_id: productId,
      variant_id: variantId,
      name: productName,
      price,
      imageUrl,
      sku_code: skuCode,
    })
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
    <button
      onClick={handleAddToCart}
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-4 rounded-xl font-bold text-lg transition shadow-sm"
    >
      Añadir al carrito
    </button>
  )
}
