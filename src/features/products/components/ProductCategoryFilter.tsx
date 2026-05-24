"use client";

import { Button } from "@/components/ui/button";
import type { Category } from "@/features/products/types/product.types";

type Props = {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  allLabel?: string;
};

export default function ProductCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  allLabel = "Todos",
}: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-6 py-4 max-w-screen-2xl mx-auto">
      <Button
        variant={selectedCategory === "ALL" ? "secondary" : "default"}
        size="sm"
        className="rounded-full shrink-0"
        onClick={() => onCategoryChange("ALL")}
      >
        {allLabel}
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedCategory === cat.id ? "secondary" : "default"}
          size="sm"
          className="rounded-full shrink-0"
          onClick={() => onCategoryChange(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
