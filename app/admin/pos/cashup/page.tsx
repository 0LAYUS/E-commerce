"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, DollarSign, AlertCircle, CheckCircle } from "lucide-react"

type CashupSummary = {
  declared_amount: number
  expected_amount: number
  difference: number
}

export default function AdminPOSCashupPage() {
  const [declaredAmount, setDeclaredAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<CashupSummary | null>(null)
  const [todayExpected, setTodayExpected] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExpected()
  }, [])

  const loadExpected = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const res = await fetch(`/api/pos/reports/summary?from=${today.toISOString()}`)
      const data = await res.json()
      setTodayExpected(data.efectivo_cash_in || 0)
    } catch (err) {
      console.error("Error loading expected:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/pos/cashup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declared_amount: parseFloat(declaredAmount),
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar arqueo")
      }

      setResult(data.summary)
    } catch (err: any) {
      alert(err.message || "Error al procesar arqueo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pos" className="p-2 hover:bg-accent rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground">Arqueo de Caja</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas en Efectivo</p>
              <p className="text-xl font-bold">{formatPrice(todayExpected)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Total recibido en efectivo hoy</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efectivo Físico</p>
              <p className="text-xl font-bold">{declaredAmount ? formatPrice(parseFloat(declaredAmount)) : "—"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Monto que declaras tener</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!declaredAmount || parseFloat(declaredAmount) >= todayExpected ? 'bg-green-100' : 'bg-red-100'}`}>
              {(parseFloat(declaredAmount) || 0) >= todayExpected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diferencia</p>
              <p className={`text-xl font-bold ${!declaredAmount ? 'text-muted-foreground' : parseFloat(declaredAmount) >= todayExpected ? 'text-green-600' : 'text-red-600'}`}>
                {declaredAmount ? formatPrice(parseFloat(declaredAmount) - todayExpected) : "—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Declarado menos esperado</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-4">Registrar Arqueo</h2>

        {result ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${result.difference === 0 ? "bg-green-50" : result.difference > 0 ? "bg-blue-50" : "bg-red-50"}`}>
              <div className="flex items-center gap-3 mb-2">
                {result.difference === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <p className="font-bold text-lg">
                  {result.difference === 0 ? "Caja cuadrada" : result.difference > 0 ? "Sobrante" : "Faltante"}
                </p>
              </div>
              <p className="text-2xl font-extrabold">{formatPrice(Math.abs(result.difference))}</p>
            </div>
            <button
              onClick={() => { setResult(null); setDeclaredAmount(""); setNotes(""); }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold"
            >
              Hacer Nuevo Arqueo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Efectivo en Caja</label>
              <input
                type="number"
                value={declaredAmount}
                onChange={(e) => setDeclaredAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full h-12 text-xl rounded-lg border border-input bg-background px-4 text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !declaredAmount}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 py-4 rounded-lg font-bold"
            >
              {isSubmitting ? "Procesando..." : "Confirmar Arqueo"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
