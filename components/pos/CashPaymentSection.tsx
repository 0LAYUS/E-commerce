"use client"

import { Banknote, CreditCard, Smartphone, Split } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { getQuickAmounts } from "@/lib/utils/quickAmounts"
import { PAYMENT_METHOD_CONFIG } from "@/lib/constants/pos"
import type { PaymentMethod } from "@/types/pos.types"

type PaymentMethodSelectorProps = {
  method: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Smartphone,
  mixto: Split,
}

export function PaymentMethodSelector({ method, onSelect }: PaymentMethodSelectorProps) {
  const methods: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia", "mixto"]

  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((m) => {
        const Icon = METHOD_ICONS[m]
        return (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
              method === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <Icon className="w-8 h-8" />
            <span className="font-semibold text-sm">{PAYMENT_METHOD_CONFIG[m].label}</span>
          </button>
        )
      })}
    </div>
  )
}

type CashPaymentSectionProps = {
  total: number
  amountReceived: string
  onChange: (value: string) => void
}

export function CashPaymentSection({ total, amountReceived, onChange }: CashPaymentSectionProps) {
  const parsedAmount = parseFloat(amountReceived) || 0
  const changeAmount = parsedAmount - total
  const quickAmounts = getQuickAmounts(total)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-card-foreground mb-2">
          Monto recibido
        </label>
        <input
          type="number"
          value={amountReceived}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 text-2xl border-2 border-primary rounded-xl px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="0"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {Array.from(new Set(quickAmounts)).map((amt) => (
          <button
            key={amt}
            onClick={() => onChange(amt.toString())}
            className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold hover:bg-accent transition"
          >
            {formatPrice(amt)}
          </button>
        ))}
      </div>

      {parsedAmount >= total && (
        <div className="text-center p-4 bg-success-muted rounded-xl">
          <p className="text-sm text-muted-foreground">Vuelto</p>
          <p className="text-3xl font-extrabold text-success">{formatPrice(changeAmount)}</p>
        </div>
      )}
    </div>
  )
}

type SplitPaymentSectionProps = {
  total: number
  splitPayments: { efectivo: string; tarjeta: string; transferencia: string }
  onChange: (payments: { efectivo: string; tarjeta: string; transferencia: string }) => void
}

export function SplitPaymentSection({ total, splitPayments, onChange }: SplitPaymentSectionProps) {
  const totalSplit =
    parseFloat(splitPayments.efectivo || "0") +
    parseFloat(splitPayments.tarjeta || "0") +
    parseFloat(splitPayments.transferencia || "0")
  const diff = totalSplit - total

  const splitFields: { key: "efectivo" | "tarjeta" | "transferencia"; label: string; Icon: typeof Banknote }[] = [
    { key: "efectivo", label: "Efectivo", Icon: Banknote },
    { key: "tarjeta", label: "Tarjeta", Icon: CreditCard },
    { key: "transferencia", label: "Transferencia", Icon: Smartphone },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Distribuye el pago entre diferentes métodos
      </p>

      <div className="space-y-3">
        {splitFields.map(({ key, label, Icon }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <input
              type="number"
              value={splitPayments[key]}
              onChange={(e) => onChange({ ...splitPayments, [key]: e.target.value })}
              placeholder="0"
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      {totalSplit === 0 ? null : (
        <div className={`text-center p-3 rounded-xl ${diff >= 0 ? "bg-success-muted" : "bg-danger-muted"}`}>
          <p className="text-sm text-muted-foreground">
            {diff >= 0 ? "Exceso" : "Faltante"}
          </p>
          <p className={`text-xl font-extrabold ${diff >= 0 ? "text-success" : "text-danger"}`}>
            {formatPrice(Math.abs(diff))}
          </p>
        </div>
      )}
    </div>
  )
}
