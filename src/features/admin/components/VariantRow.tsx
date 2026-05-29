"use client"

import { X } from "lucide-react"
import { VariantActionMenu } from "./VariantActionMenu"
import type { VariantImage } from "@/features/products/types/product.types"

type VariantRowProps = {
  variantId: string
  skuCode: string
  isActive: boolean
  optionValues: { name: string; value: string }[]
  options: { name: string }[]
  priceOverride: number | null
  stock: number
  images: VariantImage[]
  isUploading: boolean
  onToggleActive: () => void
  onPriceChange: (value: number | null) => void
  onStockChange: (value: number) => void
  onImageChange: (files: FileList | null) => void
  onDeleteImage: (imageId: string, url: string) => void
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
  images,
  isUploading,
  onToggleActive,
  onPriceChange,
  onStockChange,
  onImageChange,
  onDeleteImage,
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
          onFocus={(e) => {
            if (e.target.value === "0") {
              e.target.value = ""
            }
            e.target.select()
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
          onFocus={(e) => {
            if (e.target.value === "0") {
              e.target.value = ""
            }
            e.target.select()
          }}
          className="w-20 h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </td>
      <td className="p-3">
        <div className="space-y-2">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {images.map((img) => (
                <div key={img.id} className="relative group w-12 h-12 rounded overflow-hidden border border-border">
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id, img.url)}
                    className="absolute top-0 right-0 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <input
              id={`variant-file-${variantId}`}
              type="file"
              accept="image/*"
              multiple
              disabled={isTemp || isUploading}
              onChange={(e) => {
                onImageChange(e.target.files)
                e.target.value = ""
              }}
              className="sr-only"
            />
            <label
              htmlFor={`variant-file-${variantId}`}
              className={`inline-flex items-center gap-2 text-xs font-semibold ${isTemp || isUploading ? "text-muted-foreground cursor-not-allowed" : "text-foreground cursor-pointer"}`}
            >
              <span className={`px-2 py-1 rounded border ${isTemp ? "border-border" : isUploading ? "border-primary/50 bg-primary/10" : "border-input hover:border-primary"}`}>
                {isTemp ? "Guarda primero para subir" : isUploading ? "Subiendo..." : images.length > 0 ? "Agregar más" : "Subir fotos"}
              </span>
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {images.length > 0 ? `${images.length} imagen${images.length > 1 ? "es" : ""}` : "Reemplaza imagenes actuales"}
          </p>
        </div>
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
