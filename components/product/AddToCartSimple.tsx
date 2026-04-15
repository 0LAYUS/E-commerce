"use client"

import { useCart } from "@/components/providers/CartProvider"

type Props = {
  productId: string
  productName: string
  price: number
  imageUrl?: string
  stock: number
}

export default function AddToCartSimple({ productId, productName, price, imageUrl, stock }: Props) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: productId,
      product_id: productId,
      name: productName,
      price,
      imageUrl,
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
