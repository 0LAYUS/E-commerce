"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "@phosphor-icons/react"
import ProductVariantSelector from "@/components/products/ProductVariantSelector"
import AddToCartButton from "@/components/products/AddToCartButton"
import RelatedProductsCarousel from "@/components/products/RelatedProductsCarousel"

type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image_url: string
  categories?: { name: string }
}

import type { OptionDef } from "@/types/product.types"

type SKU = {
  id: string
  product_id: string
  sku_code: string
  price_override: number | null
  stock: number
  active: boolean
  option_values: string[]
}

type Props = {
  product: Product
  options: OptionDef[]
  skus: SKU[]
  basePrice: number
  hasVariants: boolean
  relatedProducts: { id: string; name: string; price: number; image_url: string }[]
}

export default function ProductDetailClient({
  product,
  options,
  skus,
  basePrice,
  hasVariants,
  relatedProducts,
}: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6 px-4 py-2 rounded-xl hover:bg-secondary border border-border"
          >
            <ArrowLeft className="w-4 h-4" weight="bold" />
            Volver a productos
          </Link>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="aspect-square bg-card rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-xl">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <ShoppingBag className="w-20 h-20" weight="duotone" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col bg-card rounded-2xl border border-border p-8 shadow-xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              className="mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider bg-secondary px-3 py-1 rounded-full border border-border">
                {product.categories?.name || "Sin categoría"}
              </span>
            </motion.div>

            <motion.h1
              className="text-3xl font-extrabold text-card-foreground mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {product.name}
            </motion.h1>

            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-4xl font-extrabold text-foreground">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(basePrice)}
              </span>
            </motion.div>

            <motion.p
              className="text-muted-foreground mb-8 leading-relaxed bg-secondary/50 p-4 rounded-xl border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {product.description}
            </motion.p>

            {hasVariants && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ProductVariantSelector
                  options={options}
                  skus={skus}
                  basePrice={basePrice}
                  productId={product.id}
                  productName={product.name}
                />
              </motion.div>
            )}

            {!hasVariants && (
              <motion.div
                className="mb-8 bg-secondary/50 p-6 rounded-xl border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Stock disponible</span>
                  <span className={`text-xl font-bold ${product.stock > 0 ? "text-green-500" : "text-destructive"}`}>
                    {product.stock > 0 ? `${product.stock} unidades` : "Agotado"}
                  </span>
                </div>
                {product.stock > 0 && (
                  <AddToCartButton
                    productId={product.id}
                    productName={product.name}
                    price={product.price}
                    imageUrl={product.image_url}
                    stock={product.stock}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <RelatedProductsCarousel products={relatedProducts} />
          </motion.div>
        )}
      </div>
    </div>
  )
}