"use client"

import { Plus } from "lucide-react"

type Variant = {
  id: string
  sku_code: string | null
  price_override: number | null
  stock: number
  active: boolean
  option_values?: string[]
}

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image_url: string | null
  category?: { id: string; name: string } | null
  variants: Variant[]
}

type ProductGridProps = {
  products: Product[]
  onSelectProduct: (product: Product, variant?: Variant) => void
  onSelectVariant: (product: Product, variant: Variant) => void
}

export default function ProductGrid({ products, onSelectProduct, onSelectVariant }: ProductGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No hay productos</p>
        <p className="text-sm">Agrega productos para comenzar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const hasVariants = product.variants && product.variants.length > 0

        if (hasVariants) {
          return (
            <div key={product.id} className="bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
              <div className="aspect-square bg-muted flex items-center justify-center p-4 border-b border-border relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">IMG</span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-card-foreground text-sm mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {product.category?.name || "Sin categoría"}
                </p>
                <div className="font-extrabold text-primary text-lg mb-1">
                  {formatPrice(product.price)}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {product.variants.length} variante(s)
                </p>
                <div className="mt-auto space-y-1">
                  {product.variants.slice(0, 2).map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => onSelectVariant(product, variant)}
                      className="w-full text-left px-3 py-2 text-xs bg-secondary rounded-lg hover:bg-accent transition flex justify-between items-center"
                    >
                      <span className="font-mono truncate">
                        {variant.sku_code || variant.id.slice(0, 8)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        Stock: {variant.stock}
                      </span>
                    </button>
                  ))}
                  {product.variants.length > 2 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{product.variants.length - 2} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        }

        return (
          <div key={product.id} className="bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
            <div className="aspect-square bg-muted flex items-center justify-center p-4 border-b border-border relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
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
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-card-foreground text-sm mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {product.category?.name || "Sin categoría"}
              </p>
              <div className="font-extrabold text-primary text-lg mb-1">
                {formatPrice(product.price)}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Stock: {product.stock}
              </p>
              <button
                onClick={() => onSelectProduct(product)}
                disabled={product.stock === 0}
                className="mt-auto w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
