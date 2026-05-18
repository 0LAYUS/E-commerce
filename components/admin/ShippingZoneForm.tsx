"use client"

import { X } from "lucide-react"
import { createShippingZone, updateShippingZone } from "@/lib/actions/adminActions"
import type { ShippingZone } from "@/types/cart.types"

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
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition p-1 bg-secondary rounded-full hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form action={handleSubmit} className="space-y-5">
            {editingZone && <input type="hidden" name="id" value={editingZone.id} />}

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre de la Zona</label>
              <input
                name="name"
                defaultValue={editingZone?.name}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ej: Nacional, Bogotá, Medellín..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Costo de Envío (COP)</label>
              <input
                name="cost"
                type="number"
                min="0"
                defaultValue={editingZone?.cost ?? 0}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="15000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                Monto Mínimo para Envío Gratis (COP)
              </label>
              <input
                name="free_threshold"
                type="number"
                min="0"
                defaultValue={editingZone?.free_threshold ?? 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="pt-4 border-t border-border mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-lg font-bold transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : editingZone ? "Actualizar Zona" : "Crear Zona"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
