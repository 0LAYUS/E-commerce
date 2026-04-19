"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, DollarSign, CreditCard, Smartphone, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SummaryData = {
  total_sales: number
  total_amount: number
  avg_ticket: number
  by_payment_method: {
    efectivo: { count: number; amount: number }
    tarjeta: { count: number; amount: number }
    transferencia: { count: number; amount: number }
    mixto: { count: number; amount: number }
  }
  efectivo_cash_in: number
}

export default function AdminPOSPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const res = await fetch(
        `/api/pos/reports/summary?from=${today.toISOString()}`
      )
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      console.error("Error loading summary:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-foreground">Dashboard POS</h1>
        <div className="flex gap-3">
          <Link
            href="/pos"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Abrir POS
          </Link>
          <Link
            href="/admin/pos/sales"
            className="border border-input hover:bg-accent px-4 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            Ver todas las ventas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas de Hoy
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_sales || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(summary?.total_amount || 0)} en ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Promedio
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(summary?.avg_ticket || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por venta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Efectivo Recibido
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(summary?.efectivo_cash_in || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En caja hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Acumulado
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(summary?.total_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ventas del día
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Efectivo</p>
                <p className="text-xs text-muted-foreground">
                  {summary?.by_payment_method?.efectivo?.count || 0} ventas
                </p>
                <p className="text-sm font-bold text-green-600">
                  {formatPrice(summary?.by_payment_method?.efectivo?.amount || 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Tarjeta</p>
                <p className="text-xs text-muted-foreground">
                  {summary?.by_payment_method?.tarjeta?.count || 0} ventas
                </p>
                <p className="text-sm font-bold text-blue-600">
                  {formatPrice(summary?.by_payment_method?.tarjeta?.amount || 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Transferencia</p>
                <p className="text-xs text-muted-foreground">
                  {summary?.by_payment_method?.transferencia?.count || 0} ventas
                </p>
                <p className="text-sm font-bold text-purple-600">
                  {formatPrice(summary?.by_payment_method?.transferencia?.amount || 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Mixto</p>
                <p className="text-xs text-muted-foreground">
                  {summary?.by_payment_method?.mixto?.count || 0} ventas
                </p>
                <p className="text-sm font-bold text-orange-600">
                  {formatPrice(summary?.by_payment_method?.mixto?.amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Link
              href="/admin/pos/cashup"
              className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">Arqueo de Caja</p>
              <p className="text-xs text-muted-foreground">Cerrar y cuadrar caja</p>
            </Link>
            <Link
              href="/admin/pos/offers"
              className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
            >
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">Ofertas 2x1</p>
              <p className="text-xs text-muted-foreground">Gestionar promociones</p>
            </Link>
            <Link
              href="/pos"
              className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
            >
              <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">Nueva Venta</p>
              <p className="text-xs text-muted-foreground">Abrir punto de venta</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
