"use client"

import { formatPrice } from "@/lib/format"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import type { Product } from "@/features/products/types/product.types"

type ProductCardProps = {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
  onToggleActive: (id: string, active: boolean) => void
}

export function ProductCard({ product, onEdit, onDelete, onToggleActive }: ProductCardProps) {
  const isActive = product.active ?? true
  const effectiveStock = product.effective_stock ?? product.stock

  return (
    <div
      className={`bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition h-full ${!isActive ? "opacity-50" : ""
        }`}
    >
      <div className="aspect-square bg-white flex items-center justify-center p-3 border-b border-border relative">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground font-mono">IMG</span>
        )}
        <button
          onClick={() => onToggleActive(product.id, !isActive)}
          className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${!isActive ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
            }`}
        >
          {!isActive ? "OFF" : "ON"}
        </button>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-card-foreground mb-0.5 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.categories?.name || "N/A"}</p>
        <div className="font-extrabold text-primary text-lg mb-1">{formatPrice(product.price)}</div>
        <div className="text-xs text-muted-foreground mb-3">
          Stock: <span className="font-medium text-foreground">{effectiveStock}</span>
        </div>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex justify-center items-center gap-1 py-1.5 border border-input rounded-md text-xs font-bold hover:bg-accent transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={() => onDelete(product.id, product.name)}
            className="w-12 flex justify-center items-center border border-input text-destructive rounded-lg hover:bg-destructive/10 hover:border-destructive/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
