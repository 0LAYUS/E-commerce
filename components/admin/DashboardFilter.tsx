"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FilterPeriod } from "@/lib/actions/adminActions"

interface DashboardFilterProps {
  value: FilterPeriod
  onChange: (value: FilterPeriod, customStart?: Date, customEnd?: Date) => void
  customStart?: Date
  customEnd?: Date
  className?: string
}

const FILTER_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "day", label: "Día" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "6months", label: "6 Meses" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" },
]

export function DashboardFilter({
  value,
  onChange,
  customStart,
  customEnd,
  className,
}: DashboardFilterProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [tempStart, setTempStart] = useState<Date | undefined>(customStart)
  const [tempEnd, setTempEnd] = useState<Date | undefined>(customEnd)

  const handleCustomApply = () => {
    onChange("custom", tempStart, tempEnd)
    setShowCustom(false)
  }

  const isCustomActive = value === "custom"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-8 text-sm"
        >
          {option.label}
        </Button>
      ))}

      <Popover open={showCustom} onOpenChange={setShowCustom}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustomActive ? "default" : "outline"}
            size="sm"
            className="h-8 text-sm"
          >
            Personalizado
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha inicio</p>
              <Calendar
                mode="single"
                selected={tempStart}
                onSelect={(date) => setTempStart(date)}
                disabled={(date) => date > new Date()}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha fin</p>
              <Calendar
                mode="single"
                selected={tempEnd}
                onSelect={(date) => setTempEnd(date)}
                disabled={(date) => date > new Date()}
                className="rounded-md border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustom(false)
                  setTempStart(customStart)
                  setTempEnd(customEnd)
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCustomApply}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
