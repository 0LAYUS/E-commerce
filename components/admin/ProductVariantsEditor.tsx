"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { updateVariant } from "@/lib/actions/productActions"

type OptionDef = {
  name: string
  values: string[]
}

type VariantData = {
  id: string
  sku_code: string
  optionValues: { name: string; value: string }[]
  stock: number
  price_override: number | null
  active: boolean
}

type ProductVariantsEditorProps = {
  initialOptions?: { name: string; values: string[] }[]
  initialVariants?: {
    id: string
    sku_code: string
    stock: number
    price_override: number | null
    active: boolean
    option_values: string[]
  }[]
  hasVariants: boolean
  onHasVariantsChange: (value: boolean) => void
}

export default function ProductVariantsEditor({
  initialOptions = [],
  initialVariants = [],
  hasVariants,
  onHasVariantsChange,
}: ProductVariantsEditorProps) {
  const [options, setOptions] = useState<OptionDef[]>(initialOptions)
  const [variantsExpanded, setVariantsExpanded] = useState(true)
  
  // Track variant data by temp-id or real-id
  const [variantData, setVariantData] = useState<Record<string, { stock: number; price_override: number | null; active: boolean }>>(() => {
    const initial: Record<string, { stock: number; price_override: number | null; active: boolean }> = {}
    initialVariants.forEach((v) => {
      initial[v.id] = {
        stock: v.stock ?? 0,
        price_override: v.price_override ?? null,
        active: v.active ?? true,
      }
    })
    return initial
  })

  // Sync variantData when initialVariants changes (e.g., when opening edit modal)
  useEffect(() => {
    if (initialVariants.length === 0) return
    setVariantData((prev) => {
      const next = { ...prev }
      let hasChanges = false
      initialVariants.forEach((v) => {
        if (!next[v.id] || next[v.id].stock !== v.stock || next[v.id].price_override !== v.price_override || next[v.id].active !== v.active) {
          next[v.id] = {
            stock: v.stock ?? 0,
            price_override: v.price_override ?? null,
            active: v.active ?? true,
          }
          hasChanges = true
        }
      })
      return hasChanges ? next : prev
    })
  }, [initialVariants])

  // Generate variants preview from options
  const variants = useMemo((): VariantData[] => {
    if (!hasVariants || options.length === 0 || options.some((o) => o.values.length === 0)) {
      return []
    }

    const generate = (
      index: number,
      current: { sku_code: string; optionValues: { name: string; value: string }[] }
    ): VariantData[] => {
      if (index === options.length) {
        const sku_code = current.sku_code
        const tempKey = `temp-${sku_code}`
        
        // Find existing data - check both UUID key and temp key
        // We need to look through initialVariants to find matching SKU
        const existingVariant = initialVariants.find(v => v.sku_code === sku_code)
        const existingData = existingVariant 
          ? variantData[existingVariant.id] 
          : variantData[tempKey]
        
        return [{
          id: existingVariant?.id || tempKey, // Use real UUID if available
          sku_code,
          optionValues: [...current.optionValues],
          stock: existingData?.stock ?? 0,
          price_override: existingData?.price_override ?? null,
          active: existingData?.active ?? true,
        }]
      }

      const results: VariantData[] = []
      const opt = options[index]
      for (const val of opt.values) {
        const separator = current.sku_code ? "-" : ""
        results.push(...generate(index + 1, {
          sku_code: current.sku_code + separator + val.toUpperCase().replace(/\s+/g, "_"),
          optionValues: [...current.optionValues, { name: opt.name, value: val }],
        }))
      }
      return results
    }

    return generate(0, { sku_code: "", optionValues: [] })
  }, [options, hasVariants, variantData, initialVariants])

  // Compute totals
  const totalVariantStock = useMemo(() => {
    return Object.values(variantData).reduce((sum, v) => sum + (v.active ? v.stock : 0), 0)
  }, [variantData])

  const activeVariantCount = useMemo(() => {
    return Object.values(variantData).filter(v => v.active).length
  }, [variantData])

  const addOption = () => {
    setOptions([...options, { name: "", values: [] }])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOptionName = (index: number, name: string) => {
    setOptions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], name }
      return next
    })
  }

  const addValue = (optIndex: number, value: string) => {
    if (!value.trim()) return
    setOptions((prev) => {
      const next = [...prev]
      if (!next[optIndex].values.includes(value.trim())) {
        next[optIndex] = { ...next[optIndex], values: [...next[optIndex].values, value.trim()] }
      }
      return next
    })
  }

  const removeValue = (optIndex: number, valIndex: number) => {
    setOptions((prev) => {
      const next = [...prev]
      next[optIndex] = { ...next[optIndex], values: next[optIndex].values.filter((_, i) => i !== valIndex) }
      return next
    })
  }

  const updateVariantField = (variantId: string, field: 'stock' | 'price_override' | 'active', value: number | null | boolean) => {
    setVariantData((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }))
  }

  // Save variant to database (for existing variants with real UUIDs)
  const saveVariant = async (variantId: string, data?: { stock: number; price_override: number | null; active: boolean }) => {
    if (variantId.startsWith('temp-')) return // Can't save temp IDs

    const variant = data ?? variantData[variantId]
    if (!variant) return

    try {
      await updateVariant(variantId, {
        stock: variant.stock,
        price_override: variant.price_override,
        active: variant.active,
      })
    } catch (err) {
      console.error("Error saving variant:", err)
    }
  }

  const getSuggestions = (name: string): string[] => {
    const lower = name.toLowerCase()
    const suggestions: Record<string, string[]> = {
      color: ["Rojo", "Azul", "Verde", "Negro", "Blanco", "Amarillo", "Morado", "Naranja", "Rosa", "Gris"],
      talla: ["XS", "S", "M", "L", "XL", "XXL"],
      tamaño: ["XS", "S", "M", "L", "XL", "XXL"],
      material: ["Algodón", "Poliéster", "Lino", "Seda", "Cuero"],
      estilo: ["Clásico", "Moderno", "Casual", "Formal", "Deportivo"],
    }
    for (const [key, values] of Object.entries(suggestions)) {
      if (lower.includes(key)) return values
    }
    return []
  }

  const handleToggle = () => {
    onHasVariantsChange(!hasVariants)
    if (!hasVariants && options.length === 0) {
      setOptions([{ name: "", values: [] }])
    }
  }

  // Serialize for form submission
  const serializedOptions = JSON.stringify(options)
  const serializedVariants = JSON.stringify(
    variants.map((v) => ({
      id: v.id,
      sku_code: v.sku_code,
      stock: variantData[v.id]?.stock ?? 0,
      price_override: variantData[v.id]?.price_override ?? null,
      active: variantData[v.id]?.active ?? true,
    }))
  )

  // Keep hidden input in sync with variantData changes
  useEffect(() => {
    const hiddenInput = document.querySelector('input[name="variant_data"]') as HTMLInputElement
    if (hiddenInput) {
      hiddenInput.value = serializedVariants
    }
  }, [variantData, variants, serializedVariants])

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Variantes</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-muted-foreground">¿Tiene variantes?</span>
          <button
            type="button"
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              hasVariants ? "bg-primary" : "bg-muted"
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
              hasVariants ? "translate-x-6" : "translate-x-0.5"
            }`} />
          </button>
        </label>
      </div>

      {/* Variants Builder */}
      {hasVariants && (
        <div className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            {options.map((opt, oIndex) => (
              <div key={oIndex} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOptionName(oIndex, e.target.value)}
                    placeholder="Nombre (ej: Color, Talla)"
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(oIndex)}
                    className="p-2 text-muted-foreground hover:text-destructive transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Values chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {opt.values.map((val, vIndex) => (
                    <span
                      key={vIndex}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => removeValue(oIndex, vIndex)}
                        className="text-muted-foreground hover:text-foreground ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add value input */}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Agregar valor y presiona Enter..."
                    className="flex-1 min-w-[150px] h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addValue(oIndex, input.value)
                        input.value = ""
                      }
                    }}
                  />
                  {getSuggestions(opt.name).map((s) => (
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

            {/* Add option button */}
            <button
              type="button"
              onClick={addOption}
              className="w-full h-12 border-2 border-dashed border-input rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar opción
            </button>
          </div>

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setVariantsExpanded(!variantsExpanded)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 border-b border-border text-left"
              >
                <span className="text-sm font-medium">
                  {activeVariantCount}/{variants.length} variantes activas — Stock total: {totalVariantStock}
                </span>
                {variantsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {variantsExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground w-10">Activo</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">SKU</th>
                        {options.map((o) => (
                          <th key={o.name} className="text-left p-3 font-medium text-muted-foreground">{o.name}</th>
                        ))}
                        <th className="text-left p-3 font-medium text-muted-foreground w-24">Precio</th>
                        <th className="text-left p-3 font-medium text-muted-foreground w-24">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} className={`border-b border-border last:border-0 ${v.active ? '' : 'opacity-50'}`}>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newActive = !variantData[v.id]?.active
                                updateVariantField(v.id, 'active', newActive)
                                if (!v.id.startsWith('temp-')) {
                                  saveVariant(v.id, { ...variantData[v.id], active: newActive })
                                }
                              }}
                              className={`w-10 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                                variantData[v.id]?.active === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                              }`}
                            >
                              {variantData[v.id]?.active === false ? 'OFF' : 'ON'}
                            </button>
                          </td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{v.sku_code}</td>
                          {options.map((o) => (
                            <td key={o.name} className="p-3 text-foreground">
                              {v.optionValues.find((ov) => ov.name === o.name)?.value || "-"}
                            </td>
                          ))}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={variantData[v.id]?.price_override ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                updateVariantField(v.id, 'price_override', val ? parseInt(val) : null)
                              }}
                              onBlur={() => {
                                if (!v.id.startsWith('temp-')) {
                                  saveVariant(v.id)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !v.id.startsWith('temp-')) {
                                  saveVariant(v.id)
                                }
                              }}
                              placeholder="Base"
                              className="w-24 h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={variantData[v.id]?.stock ?? 0}
                              onChange={(e) => {
                                updateVariantField(v.id, 'stock', parseInt(e.target.value) || 0)
                              }}
                              onBlur={() => {
                                if (!v.id.startsWith('temp-')) {
                                  saveVariant(v.id)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !v.id.startsWith('temp-')) {
                                  saveVariant(v.id)
                                }
                              }}
                              className="w-20 h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden inputs for form */}
      <input type="hidden" name="has_variants" value={hasVariants ? "true" : "false"} />
      <input type="hidden" name="variant_options" value={serializedOptions} />
      <input type="hidden" name="variant_data" value={serializedVariants} />
    </div>
  )
}
