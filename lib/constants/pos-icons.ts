import { DollarSign, CreditCard, Smartphone, TrendingUp } from "lucide-react"
import type { PaymentMethod } from "@/types/pos.types"
import type { ComponentType, SVGProps } from "react"

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, { icon: ComponentType<SVGProps<SVGSVGElement>>; colorClass: string; bgClass: string }> = {
  efectivo: { icon: DollarSign, colorClass: "text-[var(--color-success)]", bgClass: "bg-[var(--bg-success)]" },
  tarjeta: { icon: CreditCard, colorClass: "text-[var(--color-info)]", bgClass: "bg-[var(--bg-info)]" },
  transferencia: { icon: Smartphone, colorClass: "text-[var(--color-purple)]", bgClass: "bg-[var(--bg-purple)]" },
  mixto: { icon: TrendingUp, colorClass: "text-[var(--color-warning)]", bgClass: "bg-[var(--bg-warning)]" },
}
