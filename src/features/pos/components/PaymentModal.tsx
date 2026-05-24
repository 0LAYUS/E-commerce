"use client"

import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import {
  CashPaymentSection,
  PaymentMethodSelector,
  SplitPaymentSection,
} from "@/components/pos/CashPaymentSection"
import type { PaymentMethod } from "@/types/pos.types"

type PaymentModalProps = {
  isOpen: boolean
  onClose: () => void
  total: number
  onConfirm: (
    method: string,
    amountReceived?: number,
    changeAmount?: number,
    payments?: { method: string; amount: number }[]
  ) => void
}

const DEFAULT_SPLIT = { efectivo: "", tarjeta: "", transferencia: "" }

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("efectivo")
  const [amountReceived, setAmountReceived] = useState("")
  const [splitPayments, setSplitPayments] = useState(DEFAULT_SPLIT)

  useEffect(() => {
    if (isOpen) {
      setMethod("efectivo")
      setAmountReceived("")
      setSplitPayments(DEFAULT_SPLIT)
    }
  }, [isOpen])

  const parsedAmount = useMemo(() => parseFloat(amountReceived) || 0, [amountReceived])
  const splitValues = useMemo(() => {
    const efectivo = parseFloat(splitPayments.efectivo || "0") || 0
    const tarjeta = parseFloat(splitPayments.tarjeta || "0") || 0
    const transferencia = parseFloat(splitPayments.transferencia || "0") || 0
    return { efectivo, tarjeta, transferencia }
  }, [splitPayments])

  const totalSplit = splitValues.efectivo + splitValues.tarjeta + splitValues.transferencia
  const cashDue = Math.max(total - splitValues.tarjeta - splitValues.transferencia, 0)
  const changeAmount = Math.max(splitValues.efectivo - cashDue, 0)

  const canConfirm = useMemo(() => {
    if (total <= 0) return false
    if (method === "efectivo") return parsedAmount >= total
    if (method === "mixto") return totalSplit >= total && totalSplit > 0
    return true
  }, [method, parsedAmount, total, totalSplit])

  const handleConfirm = () => {
    if (!canConfirm) return

    if (method === "efectivo") {
      onConfirm("efectivo", parsedAmount, Math.max(parsedAmount - total, 0))
      return
    }

    if (method === "mixto") {
      const payments = [
        { method: "efectivo", amount: splitValues.efectivo },
        { method: "tarjeta", amount: splitValues.tarjeta },
        { method: "transferencia", amount: splitValues.transferencia },
      ].filter((p) => p.amount > 0)

      onConfirm("mixto", splitValues.efectivo || undefined, changeAmount, payments)
      return
    }

    onConfirm(method)
  }

  return (
    <Modal open={isOpen} onClose={onClose} className="p-6" preventCloseOnOverlayClick>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-card-foreground">Cobrar venta</h2>
          <p className="text-sm text-muted-foreground">
            Total a pagar: <span className="font-semibold text-foreground">{formatPrice(total)}</span>
          </p>
        </div>

        <PaymentMethodSelector method={method} onSelect={setMethod} />

        {method === "efectivo" && (
          <CashPaymentSection total={total} amountReceived={amountReceived} onChange={setAmountReceived} />
        )}

        {method === "mixto" && (
          <SplitPaymentSection total={total} splitPayments={splitPayments} onChange={setSplitPayments} />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Confirmar pago
          </Button>
        </div>
      </div>
    </Modal>
  )
}
