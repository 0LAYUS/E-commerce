"use client"

import { useState, useEffect } from "react"
import { DollarSign, CreditCard, Smartphone, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Sale = {
  id: string
  seller: { id: string; email: string }
  customer_name: string | null
  items: any[]
  subtotal: number
  discount_amount: number
  total: number
  payment_method: string
  payment_status: string
  amount_received: number | null
  change_amount: number | null
  created_at: string
}

export default function AdminPOSSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState({ from: "", to: "", payment_method: "" })

  useEffect(() => {
    loadSales()
  }, [filter])

  const loadSales = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.from) params.set("from", filter.from)
      if (filter.to) params.set("to", filter.to)
      if (filter.payment_method) params.set("payment_method", filter.payment_method)

      const res = await fetch(`/api/pos/sales?${params}`)
      const data = await res.json()
      setSales(data.sales || [])
    } catch (err) {
      console.error("Error loading sales:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "efectivo": return <DollarSign className="w-4 h-4 text-green-600" />
      case "tarjeta": return <CreditCard className="w-4 h-4 text-blue-600" />
      case "transferencia": return <Smartphone className="w-4 h-4 text-purple-600" />
      default: return <DollarSign className="w-4 h-4 text-orange-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/pos" className="p-2 hover:bg-accent rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold text-foreground">Historial de Ventas POS</h1>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <input
          type="date"
          value={filter.from}
          onChange={(e) => setFilter({ ...filter, from: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filter.to}
          onChange={(e) => setFilter({ ...filter, to: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={filter.payment_method}
          onChange={(e) => setFilter({ ...filter, payment_method: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
          <p>No hay ventas registradas</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary text-sm">
              <tr>
                <th className="text-left p-4 font-semibold">Fecha</th>
                <th className="text-left p-4 font-semibold">Cliente</th>
                <th className="text-left p-4 font-semibold">Método</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="text-right p-4 font-semibold">Vuelto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-accent/50 transition">
                  <td className="p-4 text-sm">{formatDate(sale.created_at)}</td>
                  <td className="p-4 text-sm">{sale.customer_name || "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(sale.payment_method)}
                      <span className="text-sm capitalize">{sale.payment_method}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-sm">{formatPrice(sale.total)}</td>
                  <td className="p-4 text-right text-sm text-muted-foreground">
                    {sale.change_amount ? formatPrice(sale.change_amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
