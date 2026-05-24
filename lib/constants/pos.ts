import type { PaymentMethod } from "@/types/pos.types"

export const PAYMENT_METHODS = [
  {
    key: "efectivo" as PaymentMethod,
    label: "Efectivo",
    iconColor: "text-success",
    iconBg: "bg-success-muted",
  },
  {
    key: "tarjeta" as PaymentMethod,
    label: "Tarjeta",
    iconColor: "text-info",
    iconBg: "bg-info-muted",
  },
  {
    key: "transferencia" as PaymentMethod,
    label: "Transferencia",
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
  },
  {
    key: "mixto" as PaymentMethod,
    label: "Mixto",
    iconColor: "text-warning",
    iconBg: "bg-warning-muted",
  },
]

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  efectivo: { label: "Efectivo" },
  tarjeta: { label: "Tarjeta" },
  transferencia: { label: "Transferencia" },
  mixto: { label: "Mixto" },
}
