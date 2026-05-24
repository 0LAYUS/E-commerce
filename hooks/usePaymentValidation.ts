"use client"

import type { PaymentMethod } from "@/types/pos.types"

export function usePaymentValidation(
  method: PaymentMethod,
  amountReceived: string,
  splitPayments: { efectivo: string; tarjeta: string; transferencia: string },
  total: number
) {
  const validate = (): { valid: boolean; error?: string } => {
    if (method === "efectivo") {
      const parsed = parseFloat(amountReceived) || 0
      if (parsed < total) {
        return { valid: false, error: "El monto recibido es menor al total" }
      }
      return { valid: true }
    }

    if (method === "mixto") {
      let totalSplit = 0
      if (splitPayments.efectivo) totalSplit += parseFloat(splitPayments.efectivo)
      if (splitPayments.tarjeta) totalSplit += parseFloat(splitPayments.tarjeta)
      if (splitPayments.transferencia) totalSplit += parseFloat(splitPayments.transferencia)

      if (totalSplit < total) {
        return { valid: false, error: "La suma de los pagos es menor al total" }
      }
      return { valid: true }
    }

    return { valid: true }
  }

  const getConfirmationData = () => {
    if (method === "efectivo") {
      const parsedAmount = parseFloat(amountReceived) || 0
      return {
        method,
        amountReceived: parsedAmount,
        changeAmount: parsedAmount - total,
      }
    }

    if (method === "mixto") {
      const payments = []
      if (splitPayments.efectivo) payments.push({ method: "efectivo", amount: parseFloat(splitPayments.efectivo) })
      if (splitPayments.tarjeta) payments.push({ method: "tarjeta", amount: parseFloat(splitPayments.tarjeta) })
      if (splitPayments.transferencia) payments.push({ method: "transferencia", amount: parseFloat(splitPayments.transferencia) })

      const totalSplit = payments.reduce((sum, p) => sum + p.amount, 0)
      return {
        method,
        amountReceived: totalSplit,
        changeAmount: totalSplit - total,
        payments,
      }
    }

    return { method }
  }

  const isConfirmDisabled = () => {
    if (method === "efectivo") {
      return (parseFloat(amountReceived) || 0) < total
    }
    return false
  }

  return { validate, getConfirmationData, isConfirmDisabled }
}
