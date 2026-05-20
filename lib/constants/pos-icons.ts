import { DollarSign, CreditCard, Smartphone, TrendingUp } from "lucide-react"
import type { PaymentMethod } from "@/types/pos.types"
import type { ComponentType, SVGProps } from "react"

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, { icon: ComponentType<SVGProps<SVGSVGElement>>; colorClass: string; bgClass: string }> = {
  efectivo: { icon: DollarSign, colorClass: "text-success", bgClass: "bg-success-muted" },
  tarjeta: { icon: CreditCard, colorClass: "text-info", bgClass: "bg-info-muted" },
  transferencia: { icon: Smartphone, colorClass: "text-muted-foreground", bgClass: "bg-muted" },
  mixto: { icon: TrendingUp, colorClass: "text-warning", bgClass: "bg-warning-muted" },
}
