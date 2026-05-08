import Link from "next/link"
import { CheckCircle2, XCircle, Clock, ArrowLeft, ShoppingBag } from "lucide-react"

export const metadata = {
  title: "Resultado del Pago",
}

type Status = "APPROVED" | "DECLINED" | "ERROR" | "PENDING" | string

const statusConfig: Record<string, {
  icon: React.ElementType
  iconColor: string
  bgColor: string
  borderColor: string
  title: string
  description: string
}> = {
  APPROVED: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    title: "¡Pago Exitoso!",
    description: "Tu pago fue procesado correctamente. Recibirás un correo con los detalles de tu compra muy pronto.",
  },
  DECLINED: {
    icon: XCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    title: "Pago Rechazado",
    description: "Tu pago fue rechazado por la entidad bancaria. Verifica los datos de tu tarjeta o intenta con otro método de pago.",
  },
  ERROR: {
    icon: XCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    title: "Error en el Pago",
    description: "Ocurrió un error procesando tu pago. El stock ha sido liberado. Por favor, intenta de nuevo.",
  },
  PENDING: {
    icon: Clock,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    title: "Pago en Proceso",
    description: "Tu pago está siendo procesado. Te notificaremos por correo cuando se confirme. No realices otro intento.",
  },
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string }>
}) {
  const { id, status } = await searchParams
  const currentStatus: Status = status || "ERROR"

  const config = statusConfig[currentStatus] ?? {
    icon: XCircle,
    iconColor: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    title: "Estado Desconocido",
    description: "No pudimos determinar el estado de tu pago. Revisa tu correo o contáctanos.",
  }

  const Icon = config.icon

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className={`w-full max-w-lg bg-card border rounded-2xl shadow-lg overflow-hidden`}>
        {/* Header de color según estado */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-8 py-8 flex flex-col items-center text-center`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${config.bgColor} border-2 ${config.borderColor} shadow-inner mb-4`}>
            <Icon className={`w-10 h-10 ${config.iconColor}`} />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{config.title}</h1>
        </div>

        {/* Cuerpo */}
        <div className="px-8 py-8">
          <p className="text-muted-foreground text-sm text-center leading-relaxed mb-6">
            {config.description}
          </p>

          {/* Referencia de transacción */}
          {id && (
            <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 mb-6">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                ID de Transacción Wompi
              </p>
              <p className="font-mono text-sm text-foreground break-all">{id}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            {currentStatus === "APPROVED" ? (
              <Link
                href="/profile"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-5 rounded-lg hover:bg-primary/90 transition text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver mis órdenes
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-5 rounded-lg hover:bg-primary/90 transition text-sm"
              >
                Intentar de nuevo
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-semibold py-3 px-5 rounded-lg hover:bg-muted transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la tienda
            </Link>
          </div>
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            Pago procesado de forma segura por{" "}
            <span className="font-semibold text-foreground">Wompi</span>
          </p>
        </div>
      </div>
    </div>
  )
}
