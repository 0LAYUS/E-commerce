import { formatPrice } from "@/lib/format"

type SalesMetricCardsProps = {
  totalIncome: number
  approvedOrdersCount: number
  pendingOrdersCount: number
}

export default function SalesMetricCards({ totalIncome, approvedOrdersCount, pendingOrdersCount }: SalesMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-[var(--bg-surface)] p-6 rounded-lg shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Ingresos Acumulados</h3>
        <p className="text-3xl font-extrabold text-[var(--color-success)] mt-2">{formatPrice(totalIncome)}</p>
      </div>
      <div className="bg-[var(--bg-surface)] p-6 rounded-lg shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Ventas Exitosas</h3>
        <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">{approvedOrdersCount}</p>
      </div>
      <div className="bg-[var(--bg-surface)] p-6 rounded-lg shadow-sm border">
        <h3 className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Transacciones Pendientes</h3>
        <p className="text-3xl font-extrabold text-[var(--color-warning)] mt-2">{pendingOrdersCount}</p>
      </div>
    </div>
  )
}
