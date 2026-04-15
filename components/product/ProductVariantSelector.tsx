"use client"

import { useState, useEffect } from "react"
import type { OptionType, SKU } from "@/lib/actions/variantActions"
import { useCart } from "@/components/providers/CartProvider"

type ProductVariantSelectorProps = {
  options: OptionType[]
  skus: SKU[]
  basePrice: number
}

export default function ProductVariantSelector({
  options,
  skus,
  basePrice,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null)
  const [currentPrice, setCurrentPrice] = useState(basePrice)
  const [currentStock, setCurrentStock] = useState(0)
  const { addItem } = useCart()

  useEffect(() => {
    if (options.length === 0) return

    const initial: Record<string, string> = {}
    options.forEach((opt) => {
      if (opt.values.length > 0) {
        initial[opt.name] = opt.values[0].value
      }
    })
    setSelectedOptions(initial)
  }, [options])

  useEffect(() => {
    if (skus.length === 0 || Object.keys(selectedOptions).length === 0) return

    const matchedSku = skus.find((sku) => {
      return sku.option_values.every((val) => {
        return Object.values(selectedOptions).includes(val)
      })
    })

    if (matchedSku) {
      setSelectedSku(matchedSku)
      setCurrentPrice(matchedSku.price_override ?? basePrice)
      setCurrentStock(matchedSku.stock)
    }
  }, [selectedOptions, skus, basePrice])

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }))
  }

  const handleAddToCart = () => {
    if (currentStock === 0) return

    addItem({
      id: selectedSku?.id || "",
      product_id: selectedSku?.product_id || "",
      name: "",
      price: currentPrice,
    })
  }

  return (
    <div className="space-y-6">
      {options.map((option) => (
        <div key={option.id}>
          <label className="block text-sm font-medium text-foreground mb-3">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val) => {
              const isSelected = selectedOptions[option.name] === val.value
              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => handleOptionChange(option.name, val.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:border-primary"
                  }`}
                >
                  {val.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-border pt-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Precio</span>
            <span className="text-3xl font-extrabold text-primary">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(currentPrice)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mb-1 block">Stock</span>
            <span className={`text-xl font-bold ${currentStock > 0 ? "text-green-600" : "text-destructive"}`}>
              {currentStock > 0 ? `${currentStock} unidades` : "Agotado"}
            </span>
          </div>
        </div>

        {selectedSku && (
          <div className="text-sm text-muted-foreground mb-4 font-mono">
            SKU: {selectedSku.sku_code}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={currentStock === 0}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground py-4 rounded-xl font-bold text-lg transition shadow-sm"
        >
          {currentStock === 0 ? "Agotado" : "Añadir al carrito"}
        </button>
      </div>
    </div>
  )
}
