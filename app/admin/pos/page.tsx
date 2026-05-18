"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import POSMetricCards from "@/components/admin/POSMetricCards"
import PaymentMethodCard from "@/components/admin/PaymentMethodCard"
import POSQuickActions from "@/components/admin/POSQuickActions"
import { PAYMENT_METHODS } from "@/lib/constants/pos"
import { PAYMENT_METHOD_ICONS } from "@/lib/constants/pos-icons"
import type { SummaryData } from "@/types/pos.types"

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

      <POSMetricCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Ventas por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PAYMENT_METHODS.map((pm) => {
              const iconConfig = PAYMENT_METHOD_ICONS[pm.key]
              const methodData = summary?.by_payment_method?.[pm.key]
              return (
                <PaymentMethodCard
                  key={pm.key}
                  method={{ ...pm, icon: iconConfig.icon, colorClass: iconConfig.colorClass, bgClass: iconConfig.bgClass }}
                  count={methodData?.count || 0}
                  amount={methodData?.amount || 0}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <POSQuickActions />
        </CardContent>
      </Card>
    </div>
  )
}
