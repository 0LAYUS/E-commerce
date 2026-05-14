"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Search } from "lucide-react"
import type { OrderStatus } from "@/types/order.types"

type StatusTab = {
  label: string
  value: OrderStatus | "ALL"
}

const STATUS_TABS: StatusTab[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Aprobadas", value: "APPROVED" },
  { label: "Rechazadas", value: "DECLINED" },
  { label: "Error", value: "ERROR" },
]

interface OrdersFiltersProps {
  totalCount?: number
}

export function OrdersFilters({ totalCount }: OrdersFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initial values from URL
  const initialStatus = (searchParams.get("status") as OrderStatus | "ALL") || "ALL"
  const initialSearch = searchParams.get("search") || ""

  // Local state for search input (to avoid too many URL updates)
  const [searchInput, setSearchInput] = useState(initialSearch)

  // Update URL with new params
  const updateParams = useCallback((newStatus: OrderStatus | "ALL", newSearch: string, newPage?: number) => {
    const params = new URLSearchParams()
    if (newStatus !== "ALL") params.set("status", newStatus)
    if (newSearch.trim()) params.set("search", newSearch.trim())
    if (newPage && newPage > 1) params.set("page", newPage.toString())
    // Reset to page 1 when filters change
    const queryString = params.toString()
    router.push(`/admin/orders${queryString ? `?${queryString}` : ""}`)
  }, [router])

  // Handle status tab click
  const handleStatusChange = useCallback((status: OrderStatus | "ALL") => {
    updateParams(status, searchInput)
  }, [updateParams, searchInput])

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialSearch) {
        updateParams(initialStatus as OrderStatus | "ALL", searchInput)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchInput, initialSearch, initialStatus, updateParams])

  // Sync local state if URL changes externally
  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Órdenes</h1>
        {totalCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {totalCount} orden{totalCount !== 1 ? "es" : ""} encontrada{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente, email o ID Wompi..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              initialStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}