import type { PaymentMethod } from "@/types/pos.types"

export const PAYMENT_METHODS = [
  {
    key: "efectivo" as PaymentMethod,
    label: "Efectivo",
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
  },
  {
    key: "tarjeta" as PaymentMethod,
    label: "Tarjeta",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    key: "transferencia" as PaymentMethod,
    label: "Transferencia",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  {
    key: "mixto" as PaymentMethod,
    label: "Mixto",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
  },
]

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  efectivo: { label: "Efectivo" },
  tarjeta: { label: "Tarjeta" },
  transferencia: { label: "Transferencia" },
  mixto: { label: "Mixto" },
}
