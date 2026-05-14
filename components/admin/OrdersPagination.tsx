"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { OrderStatus } from "@/types/order.types"

interface OrdersPaginationProps {
  currentPage: number
  totalPages: number
  status: OrderStatus | "ALL"
  search: string
}

export function OrdersPagination({
  currentPage,
  totalPages,
  status,
  search,
}: OrdersPaginationProps) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (search) params.set("search", search)
    params.set("page", page.toString())
    return `/admin/orders?${params.toString()}`
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    const showPages = 5

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2 rounded-md border border-border text-muted-foreground cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={buildHref(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2 rounded-md border border-border text-muted-foreground cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}