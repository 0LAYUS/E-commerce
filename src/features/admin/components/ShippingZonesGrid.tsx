"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Truck, Pencil, Trash2, Plus, X } from "lucide-react"
import { createShippingZone, updateShippingZone, deleteShippingZone } from "@/features/admin/actions/adminActions"
import { AlertDialog, ConfirmDialog } from "@/components/ui/modal"
import { ShippingZone } from "@/features/cart/types/cart.types"

export default function ShippingZonesGrid({ zones }: { zones: ShippingZone[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string }>({ title: "", description: "" })

  const openNewModal = () => {
    setEditingZone(null)
    setModalOpen(true)
  }

  const openEditModal = (zone: ShippingZone) => {
    setEditingZone(zone)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingZone(null)
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      if (editingZone) {
        await updateShippingZone(formData)
      } else {
        await createShippingZone(formData)
      }
      closeModal()
    } catch (err) {
      setAlertConfig({ title: "Error al guardar", description: String(err) })
      setAlertOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteShippingZone(deleteTarget.id)
    } catch (err) {
      setAlertConfig({ title: "Error al eliminar", description: String(err) })
      setAlertOpen(true)
    } finally {
      setDeleteTarget(null)
    }
  }

  const openDeleteConfirm = (id: string, name: string) => {
    setDeleteTarget({ id, name })
    setDeleteConfirmOpen(true)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value)

  return (
    <div className="flex flex-col h-screen px-4 py-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition" title="Volver al panel">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Zonas de Envío
        </h1>
        <button
          onClick={openNewModal}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Nueva Zona
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
          {zones?.map((zone) => (
            <div
              key={zone.id}
              className={`bg-card rounded-xl shadow-sm border p-5 flex flex-col hover:shadow-md transition ${
                !zone.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex gap-1.5 text-muted-foreground">
                  <button onClick={() => openEditModal(zone)} className="hover:text-foreground transition p-1" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDeleteConfirm(zone.id, zone.name)} className="hover:text-destructive transition p-1" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-card-foreground mb-2">{zone.name}</h3>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo de envío:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(zone.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío gratis desde:</span>
                  <span className="font-semibold text-foreground">
                    {zone.free_threshold > 0 ? formatCurrency(zone.free_threshold) : "No disponible"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    zone.active
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {zone.active ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          ))}
          {(!zones || zones.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
              No hay zonas de envío configuradas.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
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
                onClick={closeModal}
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
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="¿Eliminar zona de envío?"
        description={deleteTarget ? `¿Estás seguro que deseas eliminar la zona "${deleteTarget.name}"?` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
      />

      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertConfig.title}
        description={alertConfig.description}
      />
    </div>
  )
}