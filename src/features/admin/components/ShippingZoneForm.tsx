"use client"

import { X } from "lucide-react"
import { createShippingZone, updateShippingZone } from "@/features/admin/actions/adminActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ShippingZone } from "@/features/cart/types/cart.types"

type ShippingZoneFormProps = {
  editingZone: ShippingZone | null
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onError: (title: string, description: string) => void
  onSuccess: () => void
}

export default function ShippingZoneForm({
  editingZone,
  isOpen,
  isSubmitting,
  onClose,
  onError,
  onSuccess,
}: ShippingZoneFormProps) {
  const handleSubmit = async (formData: FormData) => {
    try {
      if (editingZone) {
        await updateShippingZone(formData)
      } else {
        await createShippingZone(formData)
      }
      onSuccess()
    } catch (err) {
      onError("Error al guardar", String(err))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity">
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b bg-card sticky top-0">
          <h2 className="text-xl font-extrabold text-card-foreground">
            {editingZone ? "Editar Zona" : "Nueva Zona de Envío"}
          </h2>
          <button onClick={onClose} className="p-1 transition" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form action={handleSubmit} className="space-y-5">
            {editingZone && <input type="hidden" name="id" value={editingZone.id} />}

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre de la Zona</label>
              <Input
                name="name"
                defaultValue={editingZone?.name}
                required
                placeholder="Ej: Nacional, Bogotá, Medellín..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Costo de Envío (COP)</label>
              <Input
                name="cost"
                type="number"
                min="0"
                defaultValue={editingZone?.cost ?? 0}
                required
                placeholder="15000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                Monto Mínimo para Envío Gratis (COP)
              </label>
              <Input
                name="free_threshold"
                type="number"
                min="0"
                defaultValue={editingZone?.free_threshold ?? 0}
                placeholder="0 = siempre se cobra envío"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa 0 para que siempre se cobre el costo de envío.
              </p>
            </div>

            {editingZone && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  value="true"
                  defaultChecked={editingZone.active}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm font-medium text-card-foreground">
                  Zona activa
                </label>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="manual_payment_allowed"
                name="manual_payment_allowed"
                value="true"
                defaultChecked={editingZone?.manual_payment_allowed ?? false}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="manual_payment_allowed" className="text-sm font-medium text-card-foreground">
                Permitir Pago Contra Entrega
              </label>
            </div>

            <div className="pt-4 border-t border-border mt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingZone ? "Actualizar Zona" : "Crear Zona"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
