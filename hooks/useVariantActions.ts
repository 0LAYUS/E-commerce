"use client"

import { useState, useCallback } from "react"
import { hasVariantSales, archiveVariant, deleteVariant } from "@/features/products/actions/productActions"

type UseVariantActionsReturn = {
  variantsWithSales: Set<string>
  confirmOpen: boolean
  confirmConfig: {
    title: string
    description: string
    onConfirm: () => Promise<void>
    confirmText: string
    destructive?: boolean
  }
  fetchVariantSales: (variantIds: string[]) => Promise<void>
  handleVariantAction: (variantId: string, skuCode: string) => Promise<void>
  saveVariant: (variantId: string, data: { stock: number; price_override: number | null; active: boolean }) => Promise<void>
  setConfirmOpen: (v: boolean) => void
}

export function useVariantActions(onAlert: (title: string, description: string) => void): UseVariantActionsReturn {
  const [variantsWithSales, setVariantsWithSales] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    description: string
    onConfirm: () => Promise<void>
    confirmText: string
    destructive?: boolean
  }>({ title: "", description: "", onConfirm: async () => {}, confirmText: "Confirmar" })

  const fetchVariantSales = useCallback(async (variantIds: string[]) => {
    const realVariants = variantIds.filter((id) => !id.startsWith("temp-"))
    if (realVariants.length === 0) return

    const salesMap = new Set<string>()
    await Promise.all(
      realVariants.map(async (v) => {
        const count = await hasVariantSales(v)
        if (count > 0) {
          salesMap.add(v)
        }
      })
    )
    setVariantsWithSales(salesMap)
  }, [])

  const saveVariant = useCallback(
    async (
      variantId: string,
      data: { stock: number; price_override: number | null; active: boolean }
    ) => {
      if (variantId.startsWith("temp-")) return

      try {
        const { updateVariant } = await import("@/features/products/actions/productActions")
        await updateVariant(variantId, {
          stock: data.stock,
          price_override: data.price_override,
          active: data.active,
        })
      } catch (err) {
        console.error("Error saving variant:", err)
      }
    },
    []
  )

  const handleVariantAction = useCallback(
    async (variantId: string, skuCode: string) => {
      if (variantId.startsWith("temp-")) return

      try {
        const salesCount = await hasVariantSales(variantId)

        if (salesCount > 0) {
          setConfirmConfig({
            title: "Archivar variante",
            description: `Esta variante (${skuCode}) tiene ${salesCount} venta${salesCount > 1 ? "s" : ""} asociada${salesCount > 1 ? "s" : ""}.\n\nSe archivará en lugar de eliminar para preservar los datos.\n\n¿Deseas continuar?`,
            onConfirm: async () => {
              await archiveVariant(variantId)
            },
            confirmText: "Archivar",
            destructive: true,
          })
          setConfirmOpen(true)
        } else {
          setConfirmConfig({
            title: "Eliminar variante",
            description: `¿Estás seguro que deseas eliminar la variante "${skuCode}"?`,
            onConfirm: async () => {
              await deleteVariant(variantId)
            },
            confirmText: "Eliminar",
            destructive: true,
          })
          setConfirmOpen(true)
        }
      } catch (err) {
        onAlert("Error", String(err))
      }
    },
    [onAlert]
  )

  return {
    variantsWithSales,
    confirmOpen,
    confirmConfig,
    fetchVariantSales,
    handleVariantAction,
    saveVariant,
    setConfirmOpen,
  }
}
