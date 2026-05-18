"use client"

import { Percent } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { CartItemRow } from "@/components/pos/CartItemRow"
import type { CartItem } from "@/types/pos.types"

type CartPOSProps = {
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onApplyDiscount: (discount_pct: number) => void
  onClearCart: () => void
  subtotal: number
  discount_amount: number
  total: number
  onOpenPayment: () => void
  customerName: string
  onCustomerNameChange: (name: string) => void
}

export default function CartPOS({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onClearCart,
  subtotal,
  discount_amount,
  total,
  onOpenPayment,
  customerName,
  onCustomerNameChange,
}: CartPOSProps) {
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      onApplyDiscount(0)
      return
    }
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onApplyDiscount(num)
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border p-6 flex flex-col h-full">
      <h2 className="text-xl font-extrabold text-card-foreground mb-4">Carrito de Venta</h2>

      <div className="mb-4">
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="Nombre del cliente (opcional)"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex-1 overflow-auto mb-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Carrito vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="border-t border-border pt-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Descuento general:</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                onChange={handleDiscountChange}
                className="w-20 h-8 rounded-md border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-extrabold text-primary pt-2 border-t border-border">
                <span>TOTAL</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClearCart}
              className="flex-1 py-3 border border-input rounded-lg font-semibold text-sm hover:bg-accent transition"
            >
              Limpiar
            </button>
            <button
              onClick={onOpenPayment}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition shadow-sm"
            >
              Cobrar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
