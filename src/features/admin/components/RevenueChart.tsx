"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { FilterPeriod, RevenueDayData } from "@/features/admin/actions/adminActions"
import { getRevenueByDay } from "@/features/admin/actions/adminActions"

interface RevenueChartProps {
  start: Date
  end: Date
  filter: FilterPeriod
  className?: string
}

interface TooltipData {
  day: string
  online: number
  pos: number
  x: number
  y: number
}

const COLORS = {
  online: "hsl(var(--chart-1))",
  pos: "hsl(var(--chart-2))",
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
} as const

const PADDING = { top: 20, right: 20, bottom: 40, left: 60 }
const HEIGHT = 280

/**
 * Line chart showing daily revenue for online orders and POS sales.
 * Uses CSS variables for colors and vanilla SVG for rendering.
 */
export function RevenueChart({ start, end, className }: RevenueChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ online: RevenueDayData[]; pos: RevenueDayData[] } | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(600)
  const [lastSvgRect, setLastSvgRect] = useState({ left: 0, top: 0, width: 600, height: 280 })

  // Fetch data
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getRevenueByDay(start, end).then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    }).catch((err) => {
      console.error("Failed to load revenue data:", err)
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [start, end])

  // Measure container width and SVG rect
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)

    // Also track SVG rect for tooltip positioning
    const svgObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setLastSvgRect(entry.target.getBoundingClientRect())
      }
    })
    svgObserver.observe(svgRef.current)

    return () => {
      observer.disconnect()
      svgObserver.disconnect()
    }
  }, [])

  // Calculate chart dimensions
  const chartWidth = width - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom

  // Calculate max value for Y axis
  const maxValue = useMemo(() => {
    if (!data) return 0
    const allValues = [...data.online.map((d) => d.revenue), ...data.pos.map((d) => d.revenue)]
    const max = Math.max(...allValues, 0)
    return max === 0 ? 1000 : max * 1.1 // Add 10% padding
  }, [data])

  // Scale functions
  const getXScale = useCallback(
    (index: number): number => {
      if (!data || data.online.length <= 1) return PADDING.left + chartWidth / 2
      return PADDING.left + (index / (data.online.length - 1)) * chartWidth
    },
    [data, chartWidth]
  )

  const xScale = useCallback(
    (day: string, index: number) => getXScale(index),
    [getXScale]
  )

  const yScale = useCallback(
    (value: number) => {
      if (maxValue === 0) return PADDING.top + chartHeight / 2
      return PADDING.top + chartHeight - (value / maxValue) * chartHeight
    },
    [maxValue, chartHeight]
  )

  // Format currency for Y axis
  const formatCOP = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toFixed(0)
  }

  // Format date for X axis
  const formatDate = (dayStr: string) => {
    const date = new Date(dayStr)
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
  }

  // Generate Y axis ticks
  const yTicks = useMemo(() => {
    if (maxValue === 0) return [0, 250, 500, 750, 1000]
    const ticks: number[] = []
    const step = maxValue / 4
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(step * i))
    }
    return ticks
  }, [maxValue])

  // Generate SVG path for a line
  const linePath = (dataPoints: RevenueDayData[]) => {
    if (dataPoints.length === 0) return ""
    return dataPoints
      .map((d, i) => {
        const x = xScale(d.day, i)
        const y = yScale(d.revenue)
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })
      .join(" ")
  }

  // Handle mouse move for tooltip - find closest point by x position
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!data || data.online.length === 0) return

    // Use SVG's own bounding rect - tooltip lives in container which has same coordinate system
    const svgRect = e.currentTarget.getBoundingClientRect()
    setLastSvgRect(svgRect)

    // Mouse position relative to SVG
    const mouseX = e.clientX - svgRect.left
    const mouseProgress = mouseX / svgRect.width

    let closestIndex = 0
    if (data.online.length > 1) {
      closestIndex = Math.round(mouseProgress * (data.online.length - 1))
      closestIndex = Math.max(0, Math.min(closestIndex, data.online.length - 1))
    }

    const dayData = data.online[closestIndex]
    const posDayData = data.pos[closestIndex]
    if (!dayData) return

    // Calculate tooltip position directly in pixels using SVG's bounding rect
    // Point positions within SVG (same coordinate system as container)
    // x: 0 = left edge of SVG, svgRect.width = right edge
    // y: 0 = top edge of SVG, svgRect.height = bottom edge
    const svgPaddingLeft = PADDING.left * (svgRect.width / width)
    const svgPaddingTop = PADDING.top * (svgRect.height / HEIGHT)
    const svgPlotWidth = (width - PADDING.left - PADDING.right) * (svgRect.width / width)
    const svgPlotHeight = (HEIGHT - PADDING.top - PADDING.bottom) * (svgRect.height / HEIGHT)

    const tooltipX = svgPaddingLeft + (closestIndex / Math.max(data.online.length - 1, 1)) * svgPlotWidth

    const maxRevenue = Math.max(dayData.revenue, posDayData?.revenue ?? 0, 1)
    const tooltipY = svgPaddingTop + svgPlotHeight * (1 - maxRevenue / maxValue)

    setHoveredIndex(closestIndex)
    setTooltip({
      day: dayData.day,
      online: dayData.revenue,
      pos: posDayData?.revenue ?? 0,
      x: tooltipX,
      y: tooltipY,
    })
  }

  const handleMouseLeave = () => {
    setTooltip(null)
    setHoveredIndex(null)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  // Loading skeleton
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resumen de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!data || data.online.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resumen de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
            Sin datos de ingresos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Resumen de Ingresos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full min-w-[300px] max-w-[600px] mx-auto">
          {/* Legend */}
          <div className="flex gap-4 mb-4 justify-end">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.online }} />
              <span className="text-xs text-muted-foreground">Órdenes Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pos }} />
              <span className="text-xs text-muted-foreground">Ventas POS</span>
            </div>
          </div>

          {/* SVG Chart */}
          <svg
            ref={svgRef}
            width={600}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="overflow-visible mx-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Y Axis Grid Lines */}
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={yScale(tick)}
                  x2={width - PADDING.right}
                  y2={yScale(tick)}
                  stroke={COLORS.grid}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 8}
                  y={yScale(tick)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-muted-foreground"
                  style={{ fill: COLORS.text, fontSize: "11px" }}
                >
                  {formatCOP(tick)}
                </text>
              </g>
            ))}

            {/* X Axis Line */}
            <line
              x1={PADDING.left}
              y1={PADDING.top + chartHeight}
              x2={width - PADDING.right}
              y2={PADDING.top + chartHeight}
              stroke={COLORS.grid}
              strokeWidth="1"
            />

            {/* X Axis Labels - show every few days based on space */}
            {data.online.map((d, i) => {
              // Only show label for first, last, and middle points
              const showLabel =
                i === 0 ||
                i === data.online.length - 1 ||
                (data.online.length > 10 && i % Math.ceil(data.online.length / 6) === 0)
              if (!showLabel) return null
              return (
                <text
                  key={d.day}
                  x={xScale(d.day, i)}
                  y={PADDING.top + chartHeight + 20}
                  textAnchor="middle"
                  style={{ fill: COLORS.text, fontSize: "11px" }}
                >
                  {formatDate(d.day)}
                </text>
              )
            })}

            {/* Hover line */}
            {hoveredIndex !== null && data.online[hoveredIndex] && (
              <line
                x1={xScale(data.online[hoveredIndex].day, hoveredIndex)}
                y1={PADDING.top}
                x2={xScale(data.online[hoveredIndex].day, hoveredIndex)}
                y2={PADDING.top + chartHeight}
                stroke={COLORS.text}
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.5"
              />
            )}

            {/* Online Orders Line */}
            <path
              d={linePath(data.online)}
              fill="none"
              stroke={COLORS.online}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* POS Sales Line */}
            <path
              d={linePath(data.pos)}
              fill="none"
              stroke={COLORS.pos}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {data.online.map((d, i) => (
              <circle
                key={`online-${i}`}
                cx={xScale(d.day, i)}
                cy={yScale(d.revenue)}
                r={hoveredIndex === i ? 5 : 3}
                fill={COLORS.online}
                className="transition-all duration-150"
              />
            ))}
            {data.pos.map((d, i) => (
              <circle
                key={`pos-${i}`}
                cx={xScale(d.day, i)}
                cy={yScale(d.revenue)}
                r={hoveredIndex === i ? 5 : 3}
                fill={COLORS.pos}
                className="transition-all duration-150"
              />
            ))}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 bg-background border rounded-lg shadow-lg px-3 py-2 text-sm pointer-events-none"
              style={{
                left: lastSvgRect.left + tooltip.x,
                top: lastSvgRect.top + tooltip.y - 80,
                transform: "translateX(-50%)",
              }}
            >
              <p className="font-medium text-foreground mb-1">
                {new Date(tooltip.day).toLocaleDateString("es-CO", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <div className="flex items-center gap-2 text-chart-1">
                <div className="w-2 h-2 rounded-full bg-chart-1" />
                <span>Online: {formatCurrency(tooltip.online)}</span>
              </div>
              <div className="flex items-center gap-2 text-chart-2">
                <div className="w-2 h-2 rounded-full bg-chart-2" />
                <span>POS: {formatCurrency(tooltip.pos)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}