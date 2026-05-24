"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductSearchBar from "./components/ProductSearchBar"
import ProductGridPOS from "./components/ProductGridPOS"
import CartPOS from "./components/CartPOS"
import PaymentModal from "./components/PaymentModal"
import ReceiptModal from "./components/ReceiptModal"
import { CategoryFilterBar } from "@/components/pos/CategoryFilterBar"
import { usePOSCart } from "@/hooks/usePOSCart"
import { usePOSPayment } from "@/hooks/usePOSPayment"

import type { POSProduct, Category } from "@/features/products/types/product.types"

export default function POSPage() {
  const [products, setProducts] = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const {
    cart,
    customerName,
    discountPct,
    subtotal,
    discountAmount,
    total,
    handleSelectProduct,
    handleSelectVariant,
    handleUpdateQuantity,
    handleRemoveItem,
    handleApplyDiscount,
    handleClearCart,
    setCustomerName,
  } = usePOSCart()

  const {
    isPaymentOpen,
    isReceiptOpen,
    lastSale,
    handlePaymentConfirm,
    handleNewSale,
    setIsPaymentOpen,
    setIsReceiptOpen,
  } = usePOSPayment(cart, customerName, discountAmount, discountPct, subtotal, total, handleClearCart)

  const loadProducts = useCallback(async (query = "", categoryId = "") => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("search", query)
      if (categoryId) params.set("category_id", categoryId)

      const res = await fetch(`/api/pos/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error("Error loading products:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error("Error loading categories:", err)
    }
  }, [])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      loadProducts(query, selectedCategory)
    },
    [loadProducts, selectedCategory]
  )

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId)
      loadProducts(searchQuery, categoryId)
    },
    [loadProducts, searchQuery]
  )

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card border-b border-border shrink-0">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-accent rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-extrabold text-card-foreground flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Punto de Venta
              </h1>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/pos/sales">
                <ReceiptText className="w-4 h-4" />
                Ver ventas
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex overflow-hidden p-6">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-4 shrink-0">
            <ProductSearchBar onSearch={handleSearch} />
          </div>

          <CategoryFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          <div className="flex-1 min-h-0 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ProductGridPOS
                products={products}
                onSelectProduct={handleSelectProduct}
                onSelectVariant={handleSelectVariant}
              />
            )}
          </div>
        </div>

        <div className="w-80 xl:w-96 shrink-0 border-l border-border overflow-auto">
          <div className="p-4">
            <CartPOS
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onApplyDiscount={handleApplyDiscount}
              onClearCart={handleClearCart}
              subtotal={subtotal}
              discount_amount={discountAmount}
              total={total}
              onOpenPayment={() => setIsPaymentOpen(true)}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
            />
          </div>
        </div>
      </main>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={total}
        onConfirm={handlePaymentConfirm}
      />

      {lastSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sale={lastSale}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  )
}
