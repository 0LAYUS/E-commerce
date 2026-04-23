"use client"

import { motion } from "framer-motion"
import HeroCarousel from "@/components/layout/HeroCarousel"
import ProductList from "@/components/products/ProductList"

type Category = {
  id: string
  name: string
}

type Product = {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  hasVariants?: boolean
}

export default function HomeContent({ categories, products }: { categories: Category[], products: Product[] }) {
  const inStockProducts = products.filter((p) => (p.stock > 0 || p.effective_stock > 0) && p.image_url)
  const randomProducts = inStockProducts.sort(() => Math.random() - 0.5).slice(0, 5)
  const carouselItems = randomProducts.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: p.description.slice(0, 80) + (p.description.length > 80 ? "..." : ""),
    image_url: p.image_url || "",
    link: `/products/${p.id}`,
  }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HeroCarousel items={carouselItems} />
      <ProductList initialProducts={products} categories={categories} />
    </motion.div>
  )
}