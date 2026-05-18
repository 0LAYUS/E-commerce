"use client"

import { VariantActionMenu } from "./VariantActionMenu"

type VariantRowProps = {
  variantId: string
  skuCode: string
  isActive: boolean
  optionValues: { name: string; value: string }[]
  options: { name: string }[]
  priceOverride: number | null
  stock: number
  onToggleActive: () => void
  onPriceChange: (value: number | null) => void
  onStockChange: (value: number) => void
  onImageChange: (files: FileList | null) => void
  onAction: (variantId: string, skuCode: string) => void
  openMenuId: string | null
  onMenuToggle: (variantId: string) => void
  hasSales?: boolean
}

export function VariantRow({
  variantId,
  skuCode,
  isActive,
  optionValues,
  options,
  priceOverride,
  stock,
  onToggleActive,
  onPriceChange,
  onStockChange,
  onImageChange,
  onAction,
  openMenuId,
  onMenuToggle,
  hasSales,
}: VariantRowProps) {
  const isTemp = variantId.startsWith("temp-")

  return (
    <tr key={variantId} className={`border-b border-border last:border-0 ${isActive ? "" : "opacity-50"}`}>
      <td className="p-3">
        <button
          type="button"
          onClick={onToggleActive}
          className={`w-10 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
            !isActive ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
          }`}
        >
          {!isActive ? "OFF" : "ON"}
        </button>
      </td>
      <td className="p-3 font-mono text-xs text-muted-foreground">{skuCode}</td>
      {options.map((o) => (
        <td key={o.name} className="p-3 text-foreground">
          {optionValues.find((ov) => ov.name === o.name)?.value || "-"}
        </td>
      ))}
      <td className="p-3">
        <input
          type="number"
          min="0"
          value={priceOverride ?? ""}
          onChange={(e) => {
            const val = e.target.value
            onPriceChange(val ? parseInt(val) : null)
          }}
          placeholder="Base"
          className="w-24 h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </td>
      <td className="p-3">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => onStockChange(parseInt(e.target.value) || 0)}
          className="w-20 h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </td>
      <td className="p-3">
        <label className={`inline-flex items-center gap-2 text-xs font-semibold ${isTemp ? "text-muted-foreground" : "text-foreground"}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isTemp}
            onChange={(e) => onImageChange(e.target.files)}
            className="hidden"
          />
          <span className={`px-2 py-1 rounded border ${isTemp ? "border-border" : "border-input hover:border-primary cursor-pointer"}`}>
            {isTemp ? "Guarda para subir" : "Subir fotos"}
          </span>
        </label>
        <p className="text-[11px] text-muted-foreground mt-1">Reemplaza imagenes actuales</p>
      </td>
      <td className="p-3">
        <VariantActionMenu
          variantId={variantId}
          open={openMenuId === variantId}
          onToggle={() => onMenuToggle(variantId)}
          onAction={onAction}
          skuCode={skuCode}
          hasSales={hasSales}
        />
      </td>
    </tr>
  )
}
