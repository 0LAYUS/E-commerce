"use client"

import { X, Banknote, CreditCard, Smartphone, Split } from "lucide-react"
import { useState } from "react"

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "mixto"

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const parsedAmount = parseFloat(amountReceived) || 0
  const changeAmount = parsedAmount - total

  const handleSubmit = () => {
    if (method === "efectivo") {
      if (parsedAmount < total) {
        alert("El monto recibido es menor al total")
        return
      }
      onConfirm(method, parsedAmount, changeAmount)
    } else if (method === "mixto") {
      const payments = []
      let totalSplit = 0

      if (splitPayments.efectivo) {
        const eff = parseFloat(splitPayments.efectivo)
        payments.push({ method: "efectivo", amount: eff })
        totalSplit += eff
      }
      if (splitPayments.tarjeta) {
        const tar = parseFloat(splitPayments.tarjeta)
        payments.push({ method: "tarjeta", amount: tar })
        totalSplit += tar
      }
      if (splitPayments.transferencia) {
        const trans = parseFloat(splitPayments.transferencia)
        payments.push({ method: "transferencia", amount: trans })
        totalSplit += trans
      }

      if (totalSplit < total) {
        alert("La suma de los pagos es menor al total")
        return
      }

      const change = totalSplit - total
      onConfirm(method, totalSplit, change, payments)
    } else {
      onConfirm(method)
    }
  }

  const quickAmounts = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000]

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
            <p className="text-4xl font-extrabold text-primary">{formatPrice(total)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod("efectivo")}
              className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                method === "efectivo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Banknote className="w-8 h-8" />
              <span className="font-semibold text-sm">Efectivo</span>
            </button>
            <button
              onClick={() => setMethod("tarjeta")}
              className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                method === "tarjeta" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <CreditCard className="w-8 h-8" />
              <span className="font-semibold text-sm">Tarjeta</span>
            </button>
            <button
              onClick={() => setMethod("transferencia")}
              className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                method === "transferencia" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Smartphone className="w-8 h-8" />
              <span className="font-semibold text-sm">Transferencia</span>
            </button>
            <button
              onClick={() => setMethod("mixto")}
              className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                method === "mixto" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Split className="w-8 h-8" />
              <span className="font-semibold text-sm">Mixto</span>
            </button>
          </div>

          {method === "efectivo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Monto recibido
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full h-14 text-2xl border-2 border-primary rounded-xl px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmountReceived(amt.toString())}
                    className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold hover:bg-accent transition"
                  >
                    {formatPrice(amt)}
                  </button>
                ))}
              </div>

              {parsedAmount >= total && (
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Vuelto</p>
                  <p className="text-3xl font-extrabold text-green-600">{formatPrice(changeAmount)}</p>
                </div>
              )}
            </div>
          )}

          {method === "mixto" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Distribuye el pago entre diferentes métodos
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Efectivo</span>
                  </div>
                  <input
                    type="number"
                    value={splitPayments.efectivo}
                    onChange={(e) => setSplitPayments({ ...splitPayments, efectivo: e.target.value })}
                    placeholder="0"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tarjeta</span>
                  </div>
                  <input
                    type="number"
                    value={splitPayments.tarjeta}
                    onChange={(e) => setSplitPayments({ ...splitPayments, tarjeta: e.target.value })}
                    placeholder="0"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Transferencia</span>
                  </div>
                  <input
                    type="number"
                    value={splitPayments.transferencia}
                    onChange={(e) => setSplitPayments({ ...splitPayments, transferencia: e.target.value })}
                    placeholder="0"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {(() => {
                const totalSplit =
                  parseFloat(splitPayments.efectivo || "0") +
                  parseFloat(splitPayments.tarjeta || "0") +
                  parseFloat(splitPayments.transferencia || "0")
                const diff = totalSplit - total
                if (totalSplit === 0) return null
                return (
                  <div className={`text-center p-3 rounded-xl ${diff >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <p className="text-sm text-muted-foreground">
                      {diff >= 0 ? "Exceso" : "Faltante"}
                    </p>
                    <p className={`text-xl font-extrabold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPrice(Math.abs(diff))}
                    </p>
                  </div>
                )
              })()}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              method === "efectivo" && parsedAmount < total
            }
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition shadow-sm"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}
