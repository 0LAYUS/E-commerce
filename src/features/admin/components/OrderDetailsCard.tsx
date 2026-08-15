"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Package, User, MapPin, CreditCard, AlertTriangle, RotateCcw, CheckCircle2, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/modal"
import { formatPrice } from "@/lib/format"
import { STATUS_BADGE_STYLES, STATUS_BADGE_DEFAULT } from "@/lib/constants/orders"
import {
  updateOrderStatus,
  rollbackOrderStock,
  markOrderAsError,
  approveManualOrder,
  cancelOrder,
} from "@/features/orders/actions/orderActions"
import { canTransitionOrder } from "@/features/orders/services/orderStatusTransitions"
import { CancelOrderModal } from "@/features/admin/components/CancelOrderModal"
import type { OrderWithRelations, OrderStatus } from "@/features/orders/types/order.types"

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente (En línea)",
  PENDING_MANUAL: "Pendiente (Contra entrega)",
  APPROVED: "Aprobada",
  DECLINED: "Cancelada / Rechazada",
  ERROR: "Error de Sistema",
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

interface OrderDetailsCardProps {
  order: OrderWithRelations
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const router = useRouter()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false)
  const [errorConfirmOpen, setErrorConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const isWompi = order.payment_method === "wompi" || !!order.wompi_transaction_id
  const canCancel = canTransitionOrder(order.status, "DECLINED")

  async function handleApproveManual() {
    setActionLoading(true)
    try {
      await approveManualOrder(order.id)
      setApproveConfirmOpen(false)
      router.refresh()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelOrder(reason: string) {
    const result = await cancelOrder(order.id, reason)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  async function handleRollback() {
    setActionLoading(true)
    try {
      await rollbackOrderStock(order.id)
      setRollbackConfirmOpen(false)
      router.refresh()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMarkAsError() {
    setActionLoading(true)
    try {
      await markOrderAsError(order.id)
      setErrorConfirmOpen(false)
      router.refresh()
    } finally {
      setActionLoading(false)
    }
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

      {/* Cancellation Banner */}
      {order.status === "DECLINED" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2 text-sm text-foreground">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <Ban className="w-5 h-5" />
            <span>Esta orden fue cancelada</span>
          </div>
          {order.cancellation_reason && (
            <p className="text-xs">
              <strong className="text-muted-foreground">Motivo:</strong> {order.cancellation_reason}
            </p>
          )}
          {order.cancelled_at && (
            <p className="text-xs text-muted-foreground">
              Fecha de cancelación: {formatDate(order.cancelled_at)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Estado de inventario: {order.stock_returned ? "✅ Stock reincorporado al inventario" : "Pendiente de devolución"}
          </p>
        </div>
      )}

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
              Ciudad / Zona: {order.shipping_zones.name}
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
          Gestión y Acciones de la Orden
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Aprobar orden contra entrega */}
          {order.status === "PENDING_MANUAL" && (
            <Button
              variant="default"
              onClick={() => setApproveConfirmOpen(true)}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Confirmar Cobro y Entrega
            </Button>
          )}

          {/* Botón de Cancelación Principal */}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading}
            >
              <Ban className="w-4 h-4 mr-1.5" />
              Cancelar Compra
            </Button>
          )}

          {/* Fallback de error solo para órdenes PENDING */}
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={() => setErrorConfirmOpen(true)}
              disabled={actionLoading}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Marcar como Error
            </Button>
          )}

          {/* Rollback de stock individual si no se ha retornado */}
          {!order.stock_returned && order.status !== "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRollbackConfirmOpen(true)}
              disabled={actionLoading}
              className="text-xs text-muted-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Forzar Restauración de Stock
            </Button>
          )}
        </div>
      </div>

      {/* Modales de Confirmación y Cancelación */}
      <CancelOrderModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        orderId={order.id}
        isWompiPayment={isWompi}
      />

      <ConfirmDialog
        open={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApproveManual}
        title="¿Confirmar cobro y entrega del pedido?"
        description="La orden pasará a estado APROBADA / COBRADA, sumará el dinero oficialmente a los reportes del negocio y se enviará un correo de confirmación al cliente."
        confirmText="Confirmar Cobro"
        cancelText="Volver"
      />

      <ConfirmDialog
        open={rollbackConfirmOpen}
        onClose={() => setRollbackConfirmOpen(false)}
        onConfirm={handleRollback}
        title="¿Restaurar stock?"
        description="Esta acción devolverá las unidades de esta orden al inventario sin cambiar el estado actual."
        confirmText="Restaurar Stock"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        open={errorConfirmOpen}
        onClose={() => setErrorConfirmOpen(false)}
        onConfirm={handleMarkAsError}
        title="¿Marcar como error?"
        description="La orden pasará a estado ERROR y se restaurará el stock automáticamente."
        confirmText="Marcar Error"
        cancelText="Cancelar"
        destructive
      />
    </div>
  )
}