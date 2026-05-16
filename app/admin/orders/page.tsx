import { getOrders } from "@/features/orders/actions/orderActions"
import { OrdersFilters } from "@/components/admin/OrdersFilters"
import { OrdersTable } from "@/components/admin/OrdersTable"
import { OrdersPagination } from "@/components/admin/OrdersPagination"
import { OrdersExportButton } from "@/components/admin/OrdersExportButton"
import type { OrderStatus } from "@/types/order.types"

interface SearchParams {
  status?: string
  search?: string
  page?: string
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Parse and validate params
  const rawStatus = params.status
  const rawSearch = params.search
  const rawPage = params.page

  // Validate status - only allow valid values
  const validStatuses: OrderStatus[] = ["PENDING", "APPROVED", "DECLINED", "ERROR"]
  const status: OrderStatus | "ALL" =
    rawStatus && validStatuses.includes(rawStatus as OrderStatus)
      ? (rawStatus as OrderStatus)
      : "ALL"

  // Validate search - sanitize string
  const search = rawSearch ? rawSearch.slice(0, 200).trim() : ""

  // Validate page - must be positive integer
  const pageNumber = parseInt(rawPage || "1", 10)
  const page = isNaN(pageNumber) || pageNumber < 1 ? 1 : pageNumber

  const result = await getOrders({
    status,
    search,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      {/* Filters - reads from URL directly, no props needed */}
      <OrdersFilters totalCount={result.total} />

      {/* Export button */}
      <div className="flex justify-end">
        <OrdersExportButton status={status} search={search} />
      </div>

      {/* Table */}
      <OrdersTable orders={result.orders} />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <OrdersPagination
          currentPage={result.page}
          totalPages={result.totalPages}
          status={status}
          search={search}
        />
      )}
    </div>
  )
}