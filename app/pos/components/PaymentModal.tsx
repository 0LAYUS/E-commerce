"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { PaymentMethodSelector, CashPaymentSection, SplitPaymentSection } from "@/components/pos/CashPaymentSection"
import { usePaymentValidation } from "@/hooks/usePaymentValidation"
import type { PaymentMethod } from "@/types/pos.types"

type PaymentModalProps = {
  isOpen: boolean
  onClose: () => void
  total: number
  onConfirm: (method: PaymentMethod, amountReceived?: number, changeAmount?: number, payments?: { method: string; amount: number }[]) => void
}

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("efectivo")
  const [amountReceived, setAmountReceived] = useState("")
  const [splitPayments, setSplitPayments] = useState({ efectivo: "", tarjeta: "", transferencia: "" })

  const { validate, getConfirmationData, isConfirmDisabled } = usePaymentValidation(
    method,
    amountReceived,
    splitPayments,
    total
  )

  const handleSubmit = () => {
    const result = validate()
    if (!result.valid) {
      alert(result.error)
      return
    }
    const data = getConfirmationData()
    onConfirm(data.method, data.amountReceived, data.changeAmount, data.payments)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border" onClick={(e) => e.stopPropagation()}>
        <div className="border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-card-foreground">Método de Pago</h2>
          <button onClick={onClose} className="p-1 bg-secondary rounded-full hover:bg-accent transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total a pagar</p>
            <p className="text-4xl font-extrabold text-primary">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(total)}</p>
          </div>

          <PaymentMethodSelector method={method} onSelect={setMethod} />

          {method === "efectivo" && (
            <CashPaymentSection
              total={total}
              amountReceived={amountReceived}
              onChange={setAmountReceived}
            />
          )}

          {method === "mixto" && (
            <SplitPaymentSection
              total={total}
              splitPayments={splitPayments}
              onChange={setSplitPayments}
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={isConfirmDisabled()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition shadow-sm"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}
