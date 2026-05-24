"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice, formatStockLabel } from "@/lib/format"
import type { POSProduct, POSVariant } from "@/features/products/types/product.types"
import VariantSelectorModal from "./VariantSelectorModal"

type ProductGridProps = {
  products: POSProduct[]
  onSelectProduct: (product: POSProduct, variant?: POSVariant) => void
  onSelectVariant: (product: POSProduct, variant: POSVariant) => void
}

export default function ProductGrid({ products, onSelectProduct, onSelectVariant }: ProductGridProps) {
  const [selectedProductForModal, setSelectedProductForModal] = useState<POSProduct | null>(null)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No hay productos</p>
        <p className="text-sm">Agrega productos para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map((product) => {
          const hasVariants = product.variants && product.variants.length > 0

          if (hasVariants) {
            return (
              <div key={product.id} className="bg-card rounded-lg shadow-sm border overflow-hidden flex flex-col">
                <div className="aspect-square bg-muted flex items-center justify-center p-2 border-b border-border relative">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">IMG</span>
                  )}
                </div>
                <div className="p-2 flex flex-col flex-grow">
                  <h3 className="font-bold text-card-foreground text-xs mb-0.5 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="font-extrabold text-primary text-sm mb-1">
                    {formatPrice(product.price)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {product.variants.length} variante(s)
                  </p>
                  <div className="mt-auto space-y-1">
                    {product.variants.slice(0, 2).map((variant) => (
                      <Button
                        key={variant.id}
                        size="xs"
                        variant="outline"
                        className="w-full justify-between"
                        disabled={variant.stock === 0}
                        onClick={() => onSelectVariant(product, variant)}
                      >
                        <span className="font-mono truncate">
                          {variant.sku_code || variant.id.slice(0, 8)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {formatStockLabel(variant.stock)}
                        </span>
                      </Button>
                    ))}
                    {product.variants.length > 2 && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setSelectedProductForModal(product)}
                      >
                        +{product.variants.length - 2} más
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={product.id} className="bg-card rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="aspect-square bg-muted flex items-center justify-center p-2 border-b border-border relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">IMG</span>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                      AGOTADO
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col flex-grow">
                <h3 className="font-bold text-card-foreground text-xs mb-0.5 line-clamp-1">
                  {product.name}
                </h3>
                <div className="font-extrabold text-primary text-sm mb-1">
                  {formatPrice(product.price)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {formatStockLabel(product.stock)}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-auto w-full"
                  disabled={product.stock === 0}
                  onClick={() => onSelectProduct(product)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <VariantSelectorModal
        product={selectedProductForModal}
        open={selectedProductForModal !== null}
        onClose={() => setSelectedProductForModal(null)}
        onSelectVariant={(product, variant) => {
          onSelectVariant(product, variant)
          setSelectedProductForModal(null)
        }}
      />
    </>
  )
}
