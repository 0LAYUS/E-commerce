"use client"

import type { Category } from "@/types/product.types"

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
          onClick={() => onCategoryChange(cat.id)}
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
  )
}
