"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { CheckCircle } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
};

type Category = {
  id: string;
  name: string;
};

export default function ProductList({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  const filteredProducts = selectedCategory === "ALL" 
    ? initialProducts 
    : initialProducts.filter(p => p.category_id === selectedCategory);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddToCart = (product: Product) => {
    addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.image_url });
    setToastMessage(`Agregaste "${product.name}" al carrito`);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-3 transition-opacity duration-300">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "ALL" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-50 flex items-center justify-center border-b p-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="object-cover h-full w-full rounded" />
              ) : (
                <span className="text-gray-400">Sin imagen</span>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1 flex-grow line-clamp-2">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-lg text-gray-900">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No se encontraron productos en esta categoría o el catálogo está vacío.
          </div>
        )}
      </div>
    </div>
  );
}
