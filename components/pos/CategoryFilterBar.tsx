"use client"

import type { Category } from "@/features/products/types/product.types"

type CategoryFilterBarProps = {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryFilterBar({ categories, selectedCategory, onCategoryChange }: CategoryFilterBarProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap shrink-0">
      <button
        onClick={() => onCategoryChange("")}
        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
          selectedCategory === ""
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
            selectedCategory === cat.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
