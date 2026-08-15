"use client"

import * as React from "react"
import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface CancelOrderModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<{ success: boolean; error?: string }>
  orderId: string
  isWompiPayment?: boolean
}

const PRESET_REASONS = [
  "Solicitado por el cliente",
  "Datos de contacto falsos o inválidos",
  "Sin disponibilidad de inventario real",
  "Dirección de entrega fuera de cobertura",
  "Error al generar la orden",
]

export function CancelOrderModal({
  open,
  onClose,
  onConfirm,
  orderId,
  isWompiPayment = false,
}: CancelOrderModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [customReason, setCustomReason] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const finalReason = selectedPreset === "Otro" ? customReason : selectedPreset

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedReason = finalReason.trim()
    if (!trimmedReason) {
      setErrorMessage("Por favor selecciona o escribe el motivo de la cancelación.")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const result = await onConfirm(trimmedReason)
      if (!result.success) {
        setErrorMessage(result.error || "Ocurrió un error al cancelar la orden.")
      } else {
        onClose()
        setSelectedPreset("")
        setCustomReason("")
      }
    } catch (err) {
      setErrorMessage((err as Error).message || "Error inesperado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Cancelar Orden #{orderId.slice(0, 8)}</h2>
            <p className="text-xs text-muted-foreground">
              Esta acción revertirá el stock de los productos y cancelará la compra.
            </p>
          </div>
        </div>

        {/* Wompi Warning */}
        {isWompiPayment && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Pago procesado en línea (Wompi)</p>
            <p>
              La orden será cancelada en el sistema y se repondrá el inventario. Sin embargo, debes realizar el reembolso del dinero manualmente desde tu portal de Wompi.
            </p>
          </div>
        )}

        {/* Reason Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Motivo de cancelación <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                  selectedPreset === preset
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePresetChange("Otro")}
              className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                selectedPreset === "Otro"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              Otro motivo (especificar)
            </button>
          </div>
        </div>

        {/* Custom Reason Textarea */}
        {selectedPreset === "Otro" && (
          <div className="space-y-1">
            <textarea
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                setErrorMessage(null)
              }}
              placeholder="Describe detalladamente el motivo de la cancelación..."
              className="w-full min-h-[80px] p-2.5 text-xs rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              required
            />
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Volver
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={loading || (!selectedPreset && !customReason.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Cancelando...
              </>
            ) : (
              "Confirmar Cancelación"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
