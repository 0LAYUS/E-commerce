"use client"

import { useState, useEffect } from "react"
import { Plus, X, RefreshCw } from "lucide-react"
import { saveProductOptions, generateSKUs, updateSKUPrices, type OptionType, type SKU } from "@/lib/actions/variantActions"

type ProductVariantsProps = {
  productId: string
  productName: string
  initialOptions: OptionType[]
  initialSKUs: SKU[]
}

const OPTION_SUGGESTIONS: Record<string, string[]> = {
  color: ["Rojo", "Azul", "Verde", "Negro", "Blanco", "Amarillo", "Morado", "Naranja", "Rosa", "Gris"],
  talla: ["XS", "S", "M", "L", "XL", "XXL"],
  tamaño: ["XS", "S", "M", "L", "XL", "XXL"],
  material: ["Algodón", "Poliéster", "Lino", "Seda", "Cuero"],
  estilo: ["Clásico", "Moderno", "Casual", "Formal", "Deportivo"],
}

export default function ProductVariants({ productId, productName, initialOptions, initialSKUs }: ProductVariantsProps) {
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([])
  const [skus, setSkus] = useState<{ id: string; sku_code: string; price_override: number | null; stock: number; option_values: string[] }[]>([])
  const [hasVariants, setHasVariants] = useState(initialOptions.length > 0)
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [editingStock, setEditingStock] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (initialOptions.length > 0) {
      setOptions(initialOptions.map((o) => ({ name: o.name, values: o.values.map((v) => v.value) })))
    }
    if (initialSKUs.length > 0) {
      setSkus(initialSKUs.map((s) => ({ id: s.id, sku_code: s.sku_code, price_override: s.price_override, stock: s.stock, option_values: s.option_values })))
    }
  }, [initialOptions, initialSKUs])

  const addOption = () => {
    setOptions([...options, { name: "", values: [] }])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOptionName = (index: number, name: string) => {
    const updated = [...options]
    updated[index].name = name
    setOptions(updated)
  }

  const addValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return
    const updated = [...options]
    if (!updated[optionIndex].values.includes(value.trim())) {
      updated[optionIndex].values.push(value.trim())
      setOptions(updated)
    }
  }

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...options]
    updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex)
    setOptions(updated)
  }

  const getSuggestions = (name: string): string[] => {
    const lower = name.toLowerCase()
    for (const [key, values] of Object.entries(OPTION_SUGGESTIONS)) {
      if (lower.includes(key)) return values
    }
    return []
  }

  const handleSaveOptions = async () => {
    setSaving(true)
    try {
      await saveProductOptions(productId, options)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSKUs = async () => {
    setGenerating(true)
    try {
      await saveProductOptions(productId, options)
      await generateSKUs(productId, productName)
      window.location.reload()
    } finally {
      setGenerating(false)
    }
  }

  const handleBulkUpdate = async () => {
    setSaving(true)
    try {
      await updateSKUPrices(skus)
    } finally {
      setSaving(false)
    }
  }

  const updateSkuPrice = (index: number, price: number | null) => {
    const updated = [...skus]
    updated[index].price_override = price
    setSkus(updated)
  }

  const updateSkuStock = (index: number, stock: number) => {
    const updated = [...skus]
    updated[index].stock = stock
    setSkus(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Variantes del producto</h3>
        <button
          type="button"
          onClick={() => setHasVariants(!hasVariants)}
          className="text-sm text-primary hover:text-primary/80"
        >
          {hasVariants ? "Usar producto simple" : "Agregar variantes"}
        </button>
      </div>

      {hasVariants && (
        <>
          <div className="space-y-4">
            {options.map((option, oIndex) => (
              <div key={oIndex} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => updateOptionName(oIndex, e.target.value)}
                    placeholder="Nombre de opción (ej: Color, Talla)"
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(oIndex)}
                    className="p-2 text-muted-foreground hover:text-destructive transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {option.values.map((val, vIndex) => (
                    <span
                      key={vIndex}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => removeValue(oIndex, vIndex)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Agregar valor..."
                    className="flex-1 min-w-[150px] h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addValue(oIndex, (e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  {getSuggestions(option.name).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addValue(oIndex, s)}
                      className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-accent transition"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addOption}
              className="w-full h-12 border-2 border-dashed border-input rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar opción (ej: Color, Talla)
            </button>
          </div>

          {options.length > 0 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveOptions}
                disabled={saving}
                className="flex-1 h-11 bg-secondary text-secondary-foreground rounded-lg font-semibold text-sm hover:bg-accent transition disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar opciones"}
              </button>
              <button
                type="button"
                onClick={handleGenerateSKUs}
                disabled={generating || options.some((o) => o.values.length === 0)}
                className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generando..." : "Generar variantes"}
              </button>
            </div>
          )}

          {skus.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-foreground">Editar en masa</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Precio</label>
                    <input
                      type="number"
                      value={editingPrice ?? ""}
                      onChange={(e) => setEditingPrice(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Precio base"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
                    <input
                      type="number"
                      value={editingStock ?? ""}
                      onChange={(e) => setEditingStock(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Stock"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = skus.map((s) => ({
                          ...s,
                          price_override: editingPrice ?? s.price_override,
                          stock: editingStock ?? s.stock,
                          option_values: s.option_values,
                        }))
                        setSkus(updated)
                        setEditingPrice(null)
                        setEditingStock(null)
                      }}
                      className="h-9 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">SKU</th>
                      {options.map((o) => (
                        <th key={o.name} className="text-left p-3 font-medium text-muted-foreground">{o.name}</th>
                      ))}
                      <th className="text-left p-3 font-medium text-muted-foreground">Precio</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skus.map((sku, index) => (
                      <tr key={sku.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-mono text-xs text-muted-foreground">{sku.sku_code}</td>
                        {options.map((o) => {
                          const { data: optionValues } = { data: null as any }
                          return (
                            <td key={o.name} className="p-3 text-foreground">
                              {sku.option_values?.find((v) => o.values.includes(v)) || "-"}
                            </td>
                          )
                        })}
                        <td className="p-3">
                          <input
                            type="number"
                            value={sku.price_override ?? ""}
                            onChange={(e) => updateSkuPrice(index, e.target.value ? parseInt(e.target.value) : null)}
                            className="w-24 h-8 px-2 rounded border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={sku.stock}
                            onChange={(e) => updateSkuStock(index, parseInt(e.target.value) || 0)}
                            className="w-20 h-8 px-2 rounded border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleBulkUpdate}
                  disabled={saving}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar cambios de variantes"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
