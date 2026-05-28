"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { POSProduct, POSVariant } from "@/features/products/types/product.types"

type ProductGridPOSProps = {
  products: POSProduct[]
  onSelectProduct: (product: POSProduct) => void
  onSelectVariant: (product: POSProduct, variant: POSVariant) => void
}

function getVariantLabel(variant: POSVariant) {
  if (variant.option_values && variant.option_values.length > 0) {
    return variant.option_values.join(" / ")
  }
  return variant.sku_code || "Variante"
}

export default function ProductGridPOS({ products, onSelectProduct, onSelectVariant }: ProductGridPOSProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const hasVariants = Boolean(product.has_variants || product.variants?.length)
        const baseStock = product.effective_stock ?? product.stock ?? 0
        const availableVariants = (product.variants || []).filter((variant) => variant.active !== false)
        const hasVariantStock = availableVariants.some((variant) => variant.stock > 0)
        const isOutOfStock = hasVariants ? !hasVariantStock : baseStock <= 0

        return (
          <div
            key={product.id}
            className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sin imagen
                </div>
              )}
              {hasVariants && (
                <Badge className="absolute top-2 left-2" variant="secondary">
                  Variantes
                </Badge>
              )}
              {isOutOfStock && (
                <Badge className="absolute top-2 right-2" variant="destructive">
                  Sin stock
                </Badge>
              )}
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground text-sm line-clamp-2">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatPrice(product.price)}</p>
              </div>

              {hasVariants ? (
                <div className="space-y-2">
                  {availableVariants.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay variantes activas</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {availableVariants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => onSelectVariant(product, variant)}
                          disabled={variant.stock <= 0}
                          className="w-full text-left border border-input rounded-lg px-3 py-2 text-xs font-medium hover:bg-accent transition disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{getVariantLabel(variant)}</span>
                            <span className="text-muted-foreground">{formatPrice(variant.price_override ?? product.price)}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Stock: {variant.stock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Stock: {baseStock}</span>
                  <Button size="sm" onClick={() => onSelectProduct(product)} disabled={baseStock <= 0}>
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
