"use client"

import { useState, useEffect, useMemo } from "react"
import { useCart } from "@/components/providers/CartProvider"
import { Alert, AlertDescription } from "@/components/ui/alert"

type OptionDef = { name: string; values: string[] }

type SKU = {
  id: string
  product_id: string
  sku_code: string
  price_override: number | null
  stock: number
  active: boolean
  option_values: string[]
}

type ProductVariantSelectorProps = {
  options: OptionDef[]
  skus: SKU[]
  basePrice: number
  productId: string
  productName: string
}

export default function ProductVariantSelector({
  options,
  skus,
  basePrice,
  productId,
  productName,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null)
  const [currentPrice, setCurrentPrice] = useState(basePrice)
  const [currentStock, setCurrentStock] = useState(0)
  const { addItem } = useCart()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeSkus = useMemo(() => skus.filter(sku => sku.active), [skus])
  const availableOptions = useMemo(() =>
    options.map(opt => ({
      ...opt,
      values: opt.values.filter(val =>
        activeSkus.some(sku => sku.option_values.includes(val))
      )
    })).filter(opt => opt.values.length > 0),
  [options, activeSkus])

  useEffect(() => {
    if (availableOptions.length === 0) return

    const initial: Record<string, string> = {}
    availableOptions.forEach((opt) => {
      if (opt.values.length > 0) {
        initial[opt.name] = opt.values[0]
      }
    })
    setSelectedOptions(initial)
  }, [availableOptions])

  useEffect(() => {
    if (activeSkus.length === 0 || Object.keys(selectedOptions).length === 0) return

    const matchedSku = activeSkus.find((sku) => {
      return sku.option_values.every((val) => {
        return Object.values(selectedOptions).includes(val)
      })
    })

    if (matchedSku) {
      setSelectedSku(matchedSku)
      setCurrentPrice(matchedSku.price_override ?? basePrice)
      setCurrentStock(matchedSku.stock)
    } else {
      setSelectedSku(null)
      setCurrentStock(0)
    }
  }, [selectedOptions, activeSkus, basePrice])

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }))
  }

  const handleAddToCart = async () => {
    if (currentStock === 0 || !selectedSku) return

    setError(null)
    setLoading(true)
    try {
      const result = await addItem({
        id: productId,
        product_id: productId,
        variant_id: selectedSku.id,
        name: productName,
        price: currentPrice,
        sku_code: selectedSku.sku_code,
      })
      if (!result.success && result.error) {
        setError(result.error)
        setTimeout(() => setError(null), 4000)
      }
    } finally {
      setLoading(false)
    }
  }

  if (availableOptions.length === 0) {
    return (
      <div className="border-t border-border pt-6">
        <div className="text-sm text-muted-foreground mb-2">Stock disponible</div>
        <div className="text-2xl font-bold text-foreground">{basePrice} unidades</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {availableOptions.map((option) => (
        <div key={option.name}>
          <label className="block text-sm font-medium text-foreground mb-3">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleOptionChange(option.name, value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:border-primary"
                  }`}
                >
                  {value}
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
          disabled={currentStock === 0 || loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground py-4 rounded-xl font-bold text-lg transition shadow-sm"
        >
          {loading ? "Agregando..." : currentStock === 0 ? "Agotado" : "Añadir al carrito"}
        </button>
      </div>
    </div>
  )
}