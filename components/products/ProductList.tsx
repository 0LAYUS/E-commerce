"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/components/providers/CartProvider"
import { CheckCircle } from "lucide-react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
}

type Category = {
  id: string
  name: string
}

export default function ProductList({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
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

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
    })
    setToastMessage(`Agregaste "${product.name}" al carrito`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-3 transition-opacity duration-300">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <Link href={`/products/${product.id}`} className="aspect-square bg-muted flex items-center justify-center border-b p-4 group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="object-cover h-full w-full rounded group-hover:scale-105 transition" />
              ) : (
                <span className="text-muted-foreground">Sin imagen</span>
              )}
            </Link>
            <div className="p-4 flex flex-col flex-grow">
              <Link href={`/products/${product.id}`}>
                <h3 className="font-semibold text-lg text-card-foreground hover:text-primary transition">{product.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground mt-1 flex-grow line-clamp-2">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-lg text-primary">
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(product.price)}
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No se encontraron productos en esta categoría o el catálogo está vacío.
          </div>
        )}
      </div>
    </div>
  )
}
