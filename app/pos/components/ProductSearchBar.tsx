"use client"

import { Search } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

type ProductSearchBarProps = {
  onSearch: (query: string) => void
}

export default function ProductSearchBar({ onSearch }: ProductSearchBarProps) {
  const [query, setQuery] = useState("")

  const debouncedSearch = useCallback((value: string) => {
    const timeout = setTimeout(() => {
      onSearch(value)
    }, 300)
    return () => clearTimeout(timeout)
  }, [onSearch])

  useEffect(() => {
    return debouncedSearch(query)
  }, [query, debouncedSearch])

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o SKU..."
        className="w-full h-12 pl-12 pr-4 text-lg rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
