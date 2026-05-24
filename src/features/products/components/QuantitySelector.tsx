"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"

type Props = {
  quantity: number
  maxStock: number
  onQuantityChange: (quantity: number) => void
  showAvailable?: boolean
}

export default function QuantitySelector({
  quantity,
  maxStock,
  onQuantityChange,
  showAvailable = true,
}: Props) {
  const handleChange = useCallback(
    (value: string) => {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed)) {
        onQuantityChange(Math.max(1, Math.min(parsed, maxStock)))
      }
    },
    [maxStock, onQuantityChange]
  )

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-foreground">Cantidad:</label>
      <Input
        type="number"
        min={1}
        max={maxStock}
        value={quantity}
        onChange={(e) => handleChange(e.target.value)}
        className="w-20 text-center"
      />
      {showAvailable && (
        <span className="text-sm text-muted-foreground">
          de {maxStock} disponibles
        </span>
      )}
    </div>
  )
}
