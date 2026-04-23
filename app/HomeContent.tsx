"use client"

import { motion } from "framer-motion"
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ProductList initialProducts={products} categories={categories} />
    </motion.div>
  )
}