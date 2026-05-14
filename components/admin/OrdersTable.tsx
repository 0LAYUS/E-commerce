"use client"

import Link from "next/link"
import type { OrderWithRelations } from "@/types/order.types"

interface OrdersTableProps {
  orders: OrderWithRelations[]
  isLoading?: boolean
}

const STATUS_STYLES = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  DECLINED: "bg-orange-50 text-orange-700 border-orange-200",
  ERROR: "bg-red-50 text-red-700 border-red-200",
} as const

const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  DECLINED: "Rechazada",
  ERROR: "Error",
} as const

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(cents)
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="animate-pulse p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-border last:border-0" />
          ))}
        </div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No se encontraron órdenes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ref ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha / Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block"
                  >
                    <div className="text-sm font-mono font-medium text-foreground hover:text-primary">
                      {order.id.slice(0, 8)}...
                    </div>
                    {order.wompi_transaction_id && (
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        Wompi: {order.wompi_transaction_id.slice(0, 8)}...
                      </div>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {order.customer_name || "Sin nombre"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customer_email || order.profiles?.email || "Sin email"}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">
                    {new Date(order.created_at).toLocaleDateString("es-CO")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${
                      STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(order.total_amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}