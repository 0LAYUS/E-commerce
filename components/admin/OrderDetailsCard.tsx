"use client"

import Image from "next/image"
import { Package, User, MapPin, CreditCard, AlertTriangle, RotateCcw } from "lucide-react"
import { updateOrderStatus, rollbackOrderStock, markOrderAsError } from "@/features/orders/actions/orderActions"
import type { OrderWithRelations, OrderStatus } from "@/types/order.types"

interface OrderDetailsCardProps {
  order: OrderWithRelations
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  async function handleStatusChange(newStatus: OrderStatus) {
    const formData = new FormData()
    formData.append("orderId", order.id)
    formData.append("status", newStatus)
    await updateOrderStatus(order.id, newStatus)
    window.location.reload()
  }

  async function handleRollback() {
    if (!confirm("¿Estás seguro de que quieres restaurar el stock sin cambiar el estado?")) {
      return
    }
    await rollbackOrderStock(order.id)
    window.location.reload()
  }

  async function handleMarkAsError() {
    if (!confirm("¿Marcar esta orden como ERROR y restaurar el stock?")) {
      return
    }
    await markOrderAsError(order.id)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Orden #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Creada el {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full border ${
            STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-700 border-gray-200"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
            <User className="w-4 h-4" />
            Información del Cliente
          </h2>
          <div className="space-y-2">
            <p className="font-medium text-foreground">{order.customer_name || "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground">{order.customer_email || order.profiles?.email || "Sin email"}</p>
            {order.wompi_transaction_id && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                Wompi ID: {order.wompi_transaction_id}
              </p>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            Dirección de Envío
          </h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {order.shipping_address || "No proporcionada"}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-semibold text-foreground">Productos</h2>
        </div>
        <div className="divide-y divide-border">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center p-4">
              {/* Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {item.products?.image_url ? (
                  <Image
                    src={item.products.image_url}
                    alt={item.products.name || "Producto"}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="ml-4 flex-1">
                <p className="font-medium text-foreground">
                  {item.products?.name || "Producto desconocido"}
                </p>
                {item.product_skus?.sku_code && (
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.product_skus.sku_code}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {item.quantity} × {formatPrice(item.price_at_purchase)}
                </p>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {formatPrice(item.price_at_purchase * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="p-4 border-t bg-muted/50 flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
          <CreditCard className="w-4 h-4" />
          Acciones
        </h2>

        <div className="space-y-4">
          {/* Status selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">Cambiar estado:</label>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="PENDING">PENDIENTE</option>
              <option value="APPROVED">APROBADA</option>
              <option value="DECLINED">RECHAZADA</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Admin actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {order.status === "PENDING" && (
              <button
                onClick={handleMarkAsError}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4" />
                Marcar como Error (con rollback)
              </button>
            )}
            <button
              onClick={handleRollback}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Stock (sin cambiar estado)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}