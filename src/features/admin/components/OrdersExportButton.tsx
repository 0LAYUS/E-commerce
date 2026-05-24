"use client"

import { Download } from "lucide-react"
import { downloadCSV, generateCSVFilename } from "@/lib/utils/csvExport"
import type { OrderStatus } from "@/features/orders/types/order.types"

interface OrdersExportButtonProps {
  status: OrderStatus | "ALL"
  search: string
}

export function OrdersExportButton({ status, search }: OrdersExportButtonProps) {
  async function handleExport() {
    // Build params
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (search) params.set("search", search)

    // Call the export API endpoint
    try {
      const response = await fetch(`/api/orders/export?${params.toString()}`)
      if (!response.ok) {
        alert("Error al exportar")
        return
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        alert("No hay datos para exportar")
        return
      }

      // Convert blob to text
      const text = await blob.text()
      const BOM = "\uFEFF"
      const csvContent = BOM + text

      downloadCSV(csvContent, generateCSVFilename())
    } catch (error) {
      console.error("Export error:", error)
      alert("Error al exportar")
    }
  }

  return (
    <form action={handleExport}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Exportar CSV
      </button>
    </form>
  )
}