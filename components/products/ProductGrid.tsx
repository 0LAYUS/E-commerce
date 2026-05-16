"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/components/providers/CartProvider"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { MagnifyingGlass, ShoppingBag, Star, Plus, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  stock?: number
  effective_stock?: number
  hasVariants?: boolean
}

type Category = {
  id: string
  name: string
}

type ProductGridProps = {
  initialProducts: Product[]
  categories: Category[]
  showOutOfStock?: boolean
  defaultCategory?: string
}

export default function ProductGrid({
  initialProducts,
  categories,
  showOutOfStock = false,
  defaultCategory = "ALL"
}: ProductGridProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const productRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { addItem } = useCart()

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category_id === selectedCategory
    const matchesSearch = searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const hasStock = showOutOfStock || (p.stock && p.stock > 0) || (p.effective_stock && p.effective_stock > 0)
    return matchesCategory && matchesSearch && hasStock
  })

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handleAddToCart = (product: Product) => {
    if (product.hasVariants) {
      router.push(`/products/${product.id}`)
      return
    }
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
    })
    setToastMessage(`"${product.name}" agregado al carrito`)
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
  }

  return (
    <div className="flex flex-col">
      <motion.div
        className="w-full bg-secondary/50 backdrop-blur-md border-b border-border px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="bold" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-full bg-background/80 backdrop-blur-lg text-foreground placeholder:text-muted-foreground border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="w-full bg-card border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex gap-2 overflow-x-auto px-6 py-4 max-w-screen-2xl mx-auto">
          <Button
            variant={selectedCategory === "ALL" ? "default" : "secondary"}
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => setSelectedCategory("ALL")}
          >
            Todos
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "secondary"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-24 right-6 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5" weight="bold" />
            </div>
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-6 max-w-screen-2xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            ref={(el) => {
              if (el) productRefs.current.set(product.id, el)
            }}
            data-product-id={product.id}
            className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-2xl hover:border-foreground/20 transition-all duration-300 cursor-pointer"
            variants={itemVariants}
            whileHover={{ y: -8 }}
            layout
            onClick={() => router.push(`/products/${product.id}`)}
          >
            <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8" weight="duotone" />
                  </div>
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}

              {product.hasVariants && (
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  Variantes
                </div>
              )}

              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-xl border border-border">
                  <MagnifyingGlass className="w-5 h-5 text-primary-foreground" weight="bold" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <div className="flex-grow">
                <h3 className="font-bold text-card-foreground group-hover:text-foreground transition-colors duration-200 line-clamp-2 text-sm leading-tight mb-2">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" weight="fill" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">(128)</span>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(product.price)}
                </span>

                <Button
                  variant={product.hasVariants ? "secondary" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddToCart(product)
                  }}
                >
                  {product.hasVariants ? "Ver" : (
                    <>
                      <Plus className="w-4 h-4" weight="bold" />
                      Agregar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-card flex items-center justify-center">
            <MagnifyingGlass className="w-10 h-10 text-muted-foreground" weight="duotone" />
          </div>
          <h3 className="text-xl font-bold text-card-foreground mb-2">No se encontraron productos</h3>
          <p className="text-muted-foreground">Intenta con otros términos de búsqueda o cambia de categoría.</p>
        </motion.div>
      )}
    </div>
  )
}
