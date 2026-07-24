"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Package, User, MapPin, CreditCard, AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/modal"
import { formatPrice } from "@/lib/format"
import { STATUS_BADGE_STYLES, STATUS_BADGE_DEFAULT } from "@/lib/constants/orders"
import { updateOrderStatus, rollbackOrderStock, markOrderAsError, approveManualOrder, cancelManualOrder } from "@/features/orders/actions/orderActions"
import type { OrderWithRelations, OrderStatus } from "@/features/orders/types/order.types"

const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  DECLINED: "Rechazada",
  ERROR: "Error",
  PENDING_MANUAL: "Manual (Pendiente)",
} as const

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface OrderDetailsCardProps {
  order: OrderWithRelations
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const router = useRouter()
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false)
  const [errorConfirmOpen, setErrorConfirmOpen] = useState(false)

  async function handleStatusChange(newStatus: OrderStatus) {
    const formData = new FormData()
    formData.append("orderId", order.id)
    formData.append("status", newStatus)
    await updateOrderStatus(order.id, newStatus)
    router.refresh()
  }

  async function handleRollback() {
    await rollbackOrderStock(order.id)
    setRollbackConfirmOpen(false)
    router.refresh()
  }

  async function handleMarkAsError() {
    await markOrderAsError(order.id)
    setErrorConfirmOpen(false)
    router.refresh()
  }

  async function handleApproveManual() {
    await approveManualOrder(order.id)
    router.refresh()
  }

  async function handleCancelManual() {
    await cancelManualOrder(order.id)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Orden #{order.id.slice(0, 8)}
            </h1>
            <button
              onClick={() => navigator.clipboard.writeText(order.id)}
              className="text-muted-foreground hover:text-foreground text-xs underline"
              title="Copiar ID completo"
            >
              Copiar ID
            </button>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Creada el {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full border ${
            STATUS_BADGE_STYLES[order.status] ?? STATUS_BADGE_DEFAULT
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
            <p className="text-sm">
              <span className="text-muted-foreground mr-1">Email:</span>
              {(order.customer_email || order.profiles?.email) ? (
                <a href={`mailto:${order.customer_email || order.profiles?.email}`} className="text-primary hover:text-primary/80 hover:underline">
                  {order.customer_email || order.profiles?.email}
                </a>
              ) : <span className="text-muted-foreground">Sin email</span>}
            </p>
            {order.customer_phone && (
              <p className="text-sm">
                <span className="text-muted-foreground mr-1">Teléfono:</span>
                <a href={`tel:${order.customer_phone}`} className="text-primary hover:text-primary/80 hover:underline">
                  {order.customer_phone}
                </a>
              </p>
            )}
            {order.payment_method && (
              <p className="text-sm font-medium mt-2">
                Pago: {order.payment_method === 'wompi' ? 'En línea (Wompi)' : 'Contra entrega (Manual)'}
              </p>
            )}
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
          {order.shipping_zones?.name && (
            <p className="text-sm font-medium text-foreground mb-1">
              Ciudad: {order.shipping_zones.name}
            </p>
          )}
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
              disabled={["APPROVED", "DECLINED", "ERROR"].includes(order.status)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="PENDING">PENDIENTE</option>
              <option value="PENDING_MANUAL">PENDIENTE (MANUAL)</option>
              <option value="APPROVED">APROBADA</option>
              <option value="DECLINED">RECHAZADA</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Admin actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {order.status === "PENDING" && (
              <Button variant="destructive" onClick={() => setErrorConfirmOpen(true)}>
                <AlertTriangle className="w-4 h-4" />
                Marcar como Error (con rollback)
              </Button>
            )}
            {order.status === "PENDING_MANUAL" && (
              <>
                <Button variant="default" onClick={handleApproveManual} className="bg-green-600 hover:bg-green-700 text-white">
                  Aprobar Pago
                </Button>
                <Button variant="destructive" onClick={handleCancelManual}>
                  Cancelar Orden (con rollback)
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setRollbackConfirmOpen(true)}>
              <RotateCcw className="w-4 h-4" />
              Restaurar Stock (sin cambiar estado)
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={rollbackConfirmOpen}
        onClose={() => setRollbackConfirmOpen(false)}
        onConfirm={handleRollback}
        title="¿Restaurar stock?"
        description="¿Estás seguro de que quieres restaurar el stock sin cambiar el estado?"
        confirmText="Restaurar"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        open={errorConfirmOpen}
        onClose={() => setErrorConfirmOpen(false)}
        onConfirm={handleMarkAsError}
        title="¿Marcar como error?"
        description="¿Marcar esta orden como ERROR y restaurar el stock?"
        confirmText="Marcar error"
        cancelText="Cancelar"
        destructive
      />
    </div>
  )
}