"use client"

import { StatusBarChart } from "@/components/admin/StatusBarChart"
import { getPOSSalesByStatus } from "@/lib/actions/adminActions"
import type { FilterPeriod } from "@/lib/actions/adminActions"

interface POSSalesStatusChartProps {
  start: Date
  end: Date
  filter: FilterPeriod
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: "Pagado", color: "hsl(var(--chart-2))" },
  pending: { label: "Pendiente", color: "hsl(var(--chart-3))" },
  failed: { label: "Fallido", color: "hsl(var(--destructive))" },
  refunded: { label: "Reembolsado", color: "hsl(var(--chart-5))" },
}

export function POSSalesStatusChart({
  start,
  end,
  filter,
  className,
}: POSSalesStatusChartProps) {
  void filter

  return (
    <StatusBarChart
      title="Ventas POS"
      fetchData={getPOSSalesByStatus}
      statusConfig={STATUS_CONFIG}
      start={start}
      end={end}
      className={className}
    />
  )
}
