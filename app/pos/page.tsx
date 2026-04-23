"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import ProductSearchBar from "./components/ProductSearchBar"
import ProductGridPOS from "./components/ProductGridPOS"
import CartPOS, { CartItem } from "./components/CartPOS"
import PaymentModal from "./components/PaymentModal"
import ReceiptModal from "./components/ReceiptModal"

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image_url: string | null
  category?: { id: string; name: string } | null
  variants: {
    id: string
    sku_code: string | null
    price_override: number | null
    stock: number
    active: boolean
    option_values?: string[]
  }[]
}

type Category = {
  id: string
  name: string
}

type SaleResponse = {
  id: string
  customer_name: string | null
  items: CartItem[]
  subtotal: number
  discount_amount: number
  total: number
  payment_method: string
  amount_received: number | null
  change_amount: number | null
  created_at: string
}

export default function POSPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [discountPct, setDiscountPct] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null)

  const loadProducts = useCallback(async (query: string = "", categoryId: string = "") => {
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    loadProducts(query, selectedCategory)
  }, [loadProducts, selectedCategory])

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
    loadProducts(searchQuery, categoryId)
  }, [loadProducts, searchQuery])

  const handleSelectProduct = useCallback((product: Product) => {
    const existingItem = cart.find(
      (item) => item.product_id === product.id && item.variant_id === null
    )

    if (existingItem) {
      if (existingItem.quantity < existingItem.stock) {
        setCart((prev) =>
          prev.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.unit_price * (1 - item.discount_pct / 100),
                }
              : item
          )
        )
      }
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: null,
        name: product.name,
        sku: null,
        quantity: 1,
        unit_price: product.price,
        discount_pct: 0,
        subtotal: product.price,
        stock: product.stock,
      }
      setCart((prev) => [...prev, newItem])
    }
  }, [cart])

  const handleSelectVariant = useCallback((product: Product, variant: Product["variants"][0]) => {
    const existingItem = cart.find((item) => item.variant_id === variant.id)

    if (existingItem) {
      if (existingItem.quantity < variant.stock) {
        setCart((prev) =>
          prev.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.unit_price * (1 - item.discount_pct / 100),
                }
              : item
          )
        )
      }
    } else {
      const price = variant.price_override || product.price
      const newItem: CartItem = {
        id: `${variant.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: variant.id,
        name: product.name,
        sku: variant.sku_code,
        quantity: 1,
        unit_price: price,
        discount_pct: 0,
        subtotal: price,
        stock: variant.stock,
      }
      setCart((prev) => [...prev, newItem])
    }
  }, [cart])

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unit_price * (1 - item.discount_pct / 100),
            }
          : item
      )
    )
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleApplyDiscount = useCallback((discount: number) => {
    setDiscountPct(discount)
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        discount_pct: discount,
        subtotal: item.quantity * item.unit_price * (1 - discount / 100),
      }))
    )
  }, [])

  const handleClearCart = useCallback(() => {
    setCart([])
    setCustomerName("")
    setDiscountPct(0)
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const discountAmount = subtotal * (discountPct / 100)
  const total = subtotal - discountAmount

  const handlePaymentConfirm = async (
    method: string,
    amountReceived?: number,
    changeAmount?: number,
    payments?: { method: string; amount: number }[]
  ) => {
    try {
      const saleData = {
        customer_name: customerName || null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct,
          subtotal: item.subtotal,
        })),
        discount_amount: discountAmount,
        discount_reason: discountPct > 0 ? `Descuento ${discountPct}%` : null,
        subtotal,
        total,
        payment_method: method,
        amount_received: amountReceived,
        change_amount: changeAmount,
        payments,
        notes: null,
      }

      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la venta")
      }

      setLastSale({
        ...data.sale,
        items: cart,
      })
      setIsPaymentOpen(false)
      setIsReceiptOpen(true)
    } catch (err: any) {
      alert(err.message || "Error al procesar la venta")
    }
  }

  const handleNewSale = () => {
    setIsReceiptOpen(false)
    setLastSale(null)
    handleClearCart()
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-card border-b border-border shrink-0">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 hover:bg-accent rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-extrabold text-card-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Punto de Venta
              </h1>
            </div>
            <Link
              href="/admin/pos"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Ver ventas
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
          <div className="mb-4 shrink-0">
              <ProductSearchBar onSearch={handleSearch} />
            </div>

          <div className="flex gap-2 mb-4 flex-wrap shrink-0">
            <button
              onClick={() => handleCategoryChange("")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                selectedCategory === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-accent"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-accent"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

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
