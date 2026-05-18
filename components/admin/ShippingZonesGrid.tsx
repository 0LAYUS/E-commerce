"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { deleteShippingZone } from "@/lib/actions/adminActions"
import { AlertDialog, ConfirmDialog } from "@/components/ui/modal"
import ShippingZoneCard from "@/components/admin/ShippingZoneCard"
import ShippingZoneForm from "@/components/admin/ShippingZoneForm"
import type { ShippingZone } from "@/types/cart.types"

export default function ShippingZonesGrid({ zones }: { zones: ShippingZone[] }) {
  const [zonesList, setZonesList] = useState(zones)
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

  const handleFormSuccess = () => {
    closeModal()
    window.location.reload()
  }

  const handleFormError = (title: string, description: string) => {
    setAlertConfig({ title, description })
    setAlertOpen(true)
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteShippingZone(deleteTarget.id)
      setZonesList((prev) => prev.filter((z) => z.id !== deleteTarget.id))
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
          {zonesList?.map((zone) => (
            <ShippingZoneCard
              key={zone.id}
              zone={zone}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
            />
          ))}
          {(!zonesList || zonesList.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
              No hay zonas de envío configuradas.
            </div>
          )}
        </div>
      </div>

      <ShippingZoneForm
        editingZone={editingZone}
        isOpen={modalOpen}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onError={handleFormError}
        onSuccess={handleFormSuccess}
      />

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
