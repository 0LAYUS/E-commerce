"use client"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { formatPrice, formatStockLabel } from "@/lib/format"
import type { POSProduct, POSVariant } from "@/types/product.types"

type VariantSelectorModalProps = {
  product: POSProduct | null
  open: boolean
  onClose: () => void
  onSelectVariant: (product: POSProduct, variant: POSVariant) => void
}

export default function VariantSelectorModal({
  product,
  open,
  onClose,
  onSelectVariant,
}: VariantSelectorModalProps) {
  if (!product) return null

  const getVariantPrice = (variant: POSVariant) => {
    return variant.price_override ?? product.price
  }

  const getOptionDisplay = (variant: POSVariant) => {
    if (!variant.option_values || variant.option_values.length === 0) return null
    return variant.option_values.join(" · ")
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="mb-4 pr-6">
          <h2 className="text-lg font-semibold text-card-foreground">{product.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {product.variants.length} variante(s) disponible(s)
          </p>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
          {product.variants.map((variant) => {
            const price = getVariantPrice(variant)
            const optionDisplay = getOptionDisplay(variant)
            const skuDisplay = variant.sku_code || variant.id.slice(0, 8)
            const isOutOfStock = variant.stock === 0

            return (
              <div
                key={variant.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {skuDisplay}
                    </span>
                    {optionDisplay && (
                      <span className="text-xs text-muted-foreground">
                        {optionDisplay}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-primary text-sm">
                      {formatPrice(price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatStockLabel(variant.stock)}
                    </span>
                  </div>
                </div>

                  <Button
                    size="xs"
                    variant="secondary"
                    disabled={isOutOfStock}
                    onClick={() => onSelectVariant(product, variant)}
                  >
                    Agregar
                  </Button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
