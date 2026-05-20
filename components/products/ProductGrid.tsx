"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check } from "@phosphor-icons/react";
import ProductCard from "@/components/products/ProductCard";
import ProductSearch from "@/components/products/ProductSearch";
import ProductCategoryFilter from "@/components/products/ProductCategoryFilter";
import ProductEmptyState from "@/components/products/ProductEmptyState";
import type { Product, Category } from "@/types/product.types";

type ProductGridProps = {
  initialProducts: Product[];
  categories: Category[];
  showOutOfStock?: boolean;
  defaultCategory?: string;
};

export default function ProductGrid({
  initialProducts,
  categories,
  showOutOfStock = false,
  defaultCategory = "ALL",
}: ProductGridProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<string>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { addItem } = useCart();

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const hasStock =
      showOutOfStock ||
      (p.stock && p.stock > 0) ||
      (p.effective_stock && p.effective_stock > 0);
    return matchesCategory && matchesSearch && hasStock;
  });

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddToCart = (product: Product) => {
    if (product.has_variants) {
      router.push(`/products/${product.id}`);
      return;
    }
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
    });
    setToastMessage(`"${product.name}" agregado al carrito`);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
  };

  return (
    <div className="flex flex-col">
      <motion.div
        className="w-full bg-secondary/50 backdrop-blur-md border-b border-border px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
          <ProductSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
      </motion.div>

      <motion.div
        className="w-full bg-card border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <ProductCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </motion.div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-24 right-6 bg-success text-success-foreground px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-success-foreground/20 flex items-center justify-center">
              <Check className="w-5 h-5" weight="bold" />
            </div>
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-6 max-w-screen-2xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            layout
          >
            <ProductCard product={product} onAddToCart={handleAddToCart} />
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ProductEmptyState />
        </motion.div>
      )}
    </div>
  );
}
