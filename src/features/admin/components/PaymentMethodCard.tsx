"use client"

import { formatPrice } from "@/lib/format"
import type { ComponentType, SVGProps } from "react"

type PaymentMethodCardProps = {
  method: {
    key: string
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    colorClass: string
    bgClass: string
  }
  count: number
  amount: number
}

export default function PaymentMethodCard({ method, count, amount }: PaymentMethodCardProps) {
  const Icon = method.icon

  return (
    <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
      <div className={`w-10 h-10 ${method.bgClass} rounded-full flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${method.colorClass}`} />
      </div>
      <div>
        <p className="text-sm font-medium">{method.label}</p>
        <p className="text-xs text-muted-foreground">
          {count} ventas
        </p>
        <p className={`text-sm font-bold ${method.colorClass}`}>
          {formatPrice(amount)}
        </p>
      </div>
    </div>
  )
}
