"use client"

import { useState, useEffect } from "react"
import { X, Calendar, DollarSign, ShoppingBag } from "lucide-react"
import { getUserDetails } from "@/lib/actions/authActions"

interface UserDetails {
  id: string
  email: string
  role: string
  created_at: string
  orders: {
    id: string
    status: string
    total_amount: number
    created_at: string
  }[]
  stats: {
    totalOrders: number
    totalSpent: number
    avgOrderValue: number
    lastOrderDate: string | null
  }
}

interface UserDetailsModalProps {
  userId: string
  onClose: () => void
}

export function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUserDetails(userId)
      .then((result) => {
        setData(result as UserDetails)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error loading user details")
        setLoading(false)
      })
  }, [userId])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const getStatusBadge = (status: string) => {
    const styles = {
      APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      DECLINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }
    const className = styles[status as keyof typeof styles] ?? "bg-gray-100 text-gray-700"
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{status}</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-card rounded-xl border shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Detalles del Usuario</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{data.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium text-foreground capitalize">{data.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de registro</p>
                  <p className="font-medium text-foreground">{formatDate(data.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Última orden</p>
                  <p className="font-medium text-foreground">
                    {data.stats.lastOrderDate ? formatDate(data.stats.lastOrderDate) : "Sin órdenes"}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-sm">Total órdenes</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{data.stats.totalOrders}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Gasto total</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.stats.totalSpent)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.stats.avgOrderValue)}</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Historial de Órdenes</h3>
                {data.orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Este usuario no tiene órdenes</p>
                ) : (
                  <div className="space-y-2">
                    {data.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.id.slice(0, 8)}...
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{formatCurrency(order.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}