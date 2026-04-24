"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/providers/CartProvider"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { MagnifyingGlass, ShoppingBag, Star, Plus, Check } from "@phosphor-icons/react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  hasVariants?: boolean
}

type Category = {
  id: string
  name: string
}

export default function ProductList({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const productRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { addItem } = useCart()

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category_id === selectedCategory
    const matchesSearch = searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in")
          }
        })
      },
      { threshold: 0.1 }
    )

    productRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [filteredProducts])

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
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  }

  return (
    <div className="flex flex-col">
      <motion.div
        className="w-full bg-gray-900 px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
          <motion.div
            className="flex-1 relative"
            whileFocus={{ scale: 1.02 }}
          >
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" weight="bold" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border border-white/30 focus:bg-white/30 focus:border-white/50 focus:outline-none transition-all"
            />
          </motion.div>
          <motion.div
            className="hidden md:flex items-center gap-2 text-white/90 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span>¿Necesitas ayuda?</span>
            <span className="font-semibold">Llámanos</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="w-full bg-card border-b"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex gap-2 overflow-x-auto px-6 py-4 max-w-screen-2xl mx-auto">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.id
                  ? "bg-gray-800 text-white shadow-lg shadow-gray-900/30 border border-gray-700"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-24 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Check className="w-5 h-5" weight="bold" />
            </motion.div>
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
            className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-2xl hover:border-gray-600 transition-all duration-300 cursor-pointer"
            variants={itemVariants}
            whileHover={{ y: -8 }}
            layout
            onClick={() => router.push(`/products/${product.id}`)}
          >
            <motion.div
              className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {product.image_url ? (
                <motion.img
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
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
                <motion.div
                  className="absolute top-3 left-3 bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md border border-gray-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  Variantes
                </motion.div>
              )}

              <motion.div
                className="absolute bottom-3 right-3"
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
              >
                <div className="w-11 h-11 bg-gray-800 rounded-full flex items-center justify-center shadow-xl border border-gray-700">
                  <MagnifyingGlass className="w-5 h-5 text-white" weight="bold" />
                </div>
              </motion.div>

              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </motion.div>

            <div className="p-4 flex flex-col flex-grow">
              <div className="flex-grow">
                <motion.h3
                  className="font-bold text-card-foreground group-hover:text-foreground transition-colors duration-200 line-clamp-2 text-sm leading-tight mb-2"
                  whileHover={{ x: 5 }}
                >
                  {product.name}
                </motion.h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
              </div>

              <motion.div
                className="flex items-center gap-1 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" weight="fill" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">(128)</span>
              </motion.div>

              <div className="flex items-end justify-between">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="text-xl font-bold text-foreground">
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(product.price)}
                  </span>
                </motion.div>

                <motion.button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddToCart(product)
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    product.hasVariants
                      ? "bg-secondary text-secondary-foreground hover:bg-gray-800 hover:text-white hover:border-gray-700"
                      : "bg-gray-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-1">
                    {product.hasVariants ? (
                      "Ver"
                    ) : (
                      <>
                        <Plus className="w-4 h-4" weight="bold" />
                        Agregar
                      </>
                    )}
                  </span>
                </motion.button>
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