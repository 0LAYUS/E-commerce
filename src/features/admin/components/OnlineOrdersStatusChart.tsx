"use client"

import { StatusBarChart } from "@/features/admin/components/StatusBarChart"
import { getOrdersByStatus } from "@/features/admin/actions/adminActions"
import type { FilterPeriod } from "@/features/admin/actions/adminActions"

interface OnlineOrdersStatusChartProps {
  start: Date
  end: Date
  filter: FilterPeriod
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "hsl(var(--chart-3))" },
  APPROVED: { label: "Aprobado", color: "hsl(var(--chart-2))" },
  DECLINED: { label: "Rechazado", color: "hsl(var(--destructive))" },
  ERROR: { label: "Error", color: "hsl(var(--chart-5))" },
}

export function OnlineOrdersStatusChart({
  start,
  end,
  filter,
  className,
}: OnlineOrdersStatusChartProps) {
  void filter

  return (
    <StatusBarChart
      title="Órdenes Online"
      fetchData={getOrdersByStatus}
      statusConfig={STATUS_CONFIG}
      start={start}
      end={end}
      className={className}
    />
  )
}
