"use client"

import { useEffect, useState, useCallback } from "react"
import { DollarSign, CreditCard, Package } from "lucide-react"
import {
  calculatePeriodDates,
  getTotalRevenue,
  getPOSSalesCount,
  getReservedStockCount,
  getBestSellingProduct,
  getOnlineRevenue,
  getPOSSalesTotal,
  type FilterPeriod,
} from "@/lib/actions/adminActions"
import { MetricCard } from "./MetricCard"
import { BestSellerCard } from "./BestSellerCard"
import { DashboardFilter } from "./DashboardFilter"

interface DashboardData {
  totalRevenue: number
  onlineRevenue: number
  posRevenue: number
  posSalesCount: number
  reservedStock: number
  bestSeller: {
    id: string
    name: string
    image_url: string | null
    total_sold: number
  } | null
}

export function DashboardClient() {
  const [filter, setFilter] = useState<FilterPeriod>("week")
  const [customStart, setCustomStart] = useState<Date | undefined>()
  const [customEnd, setCustomEnd] = useState<Date | undefined>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { start, end } = await calculatePeriodDates(filter, customStart, customEnd)

      const [totalRevenue, onlineRevenue, posRevenue, posSalesCount, reservedStock, bestSeller] =
        await Promise.all([
          getTotalRevenue(start, end),
          getOnlineRevenue(start, end),
          getPOSSalesTotal(start, end),
          getPOSSalesCount(start, end),
          getReservedStockCount(), // NOT filtered - always current
          getBestSellingProduct(start, end),
        ])

      setData({
        totalRevenue,
        onlineRevenue,
        posRevenue,
        posSalesCount,
        reservedStock,
        bestSeller,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [filter, customStart, customEnd])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (newFilter: FilterPeriod, newCustomStart?: Date, newCustomEnd?: Date) => {
    setFilter(newFilter)
    if (newCustomStart !== undefined) setCustomStart(newCustomStart)
    if (newCustomEnd !== undefined) setCustomEnd(newCustomEnd)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-6">
      <DashboardFilter
        value={filter}
        onChange={handleFilterChange}
        customStart={customStart}
        customEnd={customEnd}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Total"
          value={loading ? 0 : formatCurrency(data?.totalRevenue ?? 0)}
          subtitle={
            loading
              ? undefined
              : data
              ? `Online: ${formatCurrency(data.onlineRevenue)} | POS: ${formatCurrency(data.posRevenue)}`
              : undefined
          }
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
        />

        <MetricCard
          title="Ventas POS"
          value={loading ? 0 : data?.posSalesCount ?? 0}
          subtitle={loading ? undefined : "Transacciones en el periodo"}
          icon={<CreditCard className="h-4 w-4" />}
          loading={loading}
        />

        <MetricCard
          title="Stock Reservado"
          value={loading ? 0 : data?.reservedStock ?? 0}
          subtitle="Reservas pendientes activas"
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />

        <BestSellerCard product={data?.bestSeller ?? null} loading={loading} />
      </div>
    </div>
  )
}
