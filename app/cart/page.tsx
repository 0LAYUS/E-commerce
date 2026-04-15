"use client"

import { useCart } from "@/components/providers/CartProvider"
import Link from "next/link"
import { Trash2, Minus, Plus } from "lucide-react"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total } = useCart()

  const handleDecrement = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty - 1)
  }

  const handleIncrement = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty + 1)
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

  return (
    <div className="mt-4 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground mb-8">Mi Carrito</h1>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative flex p-4 bg-card rounded-xl shadow-sm border items-center">
              <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground">IMG</div>
                )}
              </div>

              <div className="ml-6 flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-card-foreground">{item.name}</h3>
                {item.sku_code && (
                  <p className="text-xs text-muted-foreground font-mono mb-1">{item.sku_code}</p>
                )}
                <div className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(item.price)}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch">
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="text-destructive hover:text-destructive/80 p-1 mb-auto transition"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

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
              </div>
            </div>
          ))}
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

          <Link href="/checkout" className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition shadow-sm">
            Proceder al Pago
          </Link>
        </div>
      </div>
    </div>
  )
}
