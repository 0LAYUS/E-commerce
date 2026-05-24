"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusCount {
  status: string
  count: number
}

interface StatusBarChartProps {
  title: string
  fetchData: (start: Date, end: Date) => Promise<StatusCount[]>
  statusConfig: Record<string, { label: string; color: string }>
  defaultColor?: string
  start: Date
  end: Date
  className?: string
}

const DEFAULT_COLOR = "hsl(var(--muted-foreground))"

export function StatusBarChart({
  title,
  fetchData,
  statusConfig,
  defaultColor = DEFAULT_COLOR,
  start,
  end,
  className,
}: StatusBarChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StatusCount[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchData(start, end)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(`Failed to load ${title}:`, err)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [start, end, fetchData, title])

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const BAR_MAX_WIDTH = 200

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
              <div className="flex-1 h-6 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => {
          const config = statusConfig[item.status] ?? {
            label: item.status,
            color: defaultColor,
          }
          const barWidth = (item.count / maxCount) * BAR_MAX_WIDTH

          return (
            <div key={item.status} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span
                className="text-sm font-medium text-foreground shrink-0 w-20 truncate"
                title={config.label}
              >
                {config.label}
              </span>
              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}px`,
                    backgroundColor: config.color,
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                  {item.count}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
