"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { hasSales, deleteProduct as deleteProductAction } from "@/features/products/actions/productActions"

type UseProductDeleteReturn = {
  deleteConfirmOpen: boolean
  archiveConfirmOpen: boolean
  deleteTarget: { id: string; name: string } | null
  openDeleteConfirm: (id: string, name: string) => Promise<void>
  handleDelete: () => Promise<void>
  handleArchiveConfirm: () => Promise<void>
  setDeleteConfirmOpen: (v: boolean) => void
  setArchiveConfirmOpen: (v: boolean) => void
  setDeleteTarget: (v: { id: string; name: string } | null) => void
}

export function useProductDelete(onAlert: (title: string, description: string) => void): UseProductDeleteReturn {
  const router = useRouter()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    try {
      const salesCount = await hasSales(deleteTarget.id)
      if (salesCount > 0) {
        const result = await deleteProductAction(deleteTarget.id, true)
        if (result.success) {
          router.refresh()
        }
      } else {
        await deleteProductAction(deleteTarget.id)
        router.refresh()
      }
    } catch (err) {
      onAlert("Error", String(err))
    } finally {
      setDeleteTarget(null)
      setDeleteConfirmOpen(false)
    }
  }, [deleteTarget, router, onAlert])

  const handleArchiveConfirm = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteProductAction(deleteTarget.id, true)
      router.refresh()
    } catch (err) {
      onAlert("Error", String(err))
    } finally {
      setDeleteTarget(null)
      setArchiveConfirmOpen(false)
    }
  }, [deleteTarget, router, onAlert])

  const openDeleteConfirm = useCallback(
    async (id: string, name: string) => {
      try {
        const salesCount = await hasSales(id)
        setDeleteTarget({ id, name })
        if (salesCount > 0) {
          onAlert(
            "Archivar producto",
            `Este producto tiene ${salesCount} venta${salesCount > 1 ? "s" : ""} asociada${salesCount > 1 ? "s" : ""}.\n\nSe archivará en lugar de eliminar.`
          )
          setArchiveConfirmOpen(true)
        } else {
          setDeleteConfirmOpen(true)
        }
      } catch (err) {
        onAlert("Error", String(err))
      }
    },
    [onAlert]
  )

  return {
    deleteConfirmOpen,
    archiveConfirmOpen,
    deleteTarget,
    openDeleteConfirm,
    handleDelete,
    handleArchiveConfirm,
    setDeleteConfirmOpen,
    setArchiveConfirmOpen,
    setDeleteTarget,
  }
}
