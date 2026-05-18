import { TrendingUp, CheckCircle, Clock } from "lucide-react"
import { MetricCard } from "@/components/admin/MetricCard"
import { formatPrice } from "@/lib/format"

type SalesMetricCardsProps = {
  totalIncome: number
  approvedOrdersCount: number
  pendingOrdersCount: number
}

export default function SalesMetricCards({ totalIncome, approvedOrdersCount, pendingOrdersCount }: SalesMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        title="Ingresos Acumulados"
        value={formatPrice(totalIncome)}
        icon={<TrendingUp className="w-5 h-5 text-chart-2" />}
      />
      <MetricCard
        title="Ventas Exitosas"
        value={approvedOrdersCount}
        icon={<CheckCircle className="w-5 h-5 text-chart-2" />}
      />
      <MetricCard
        title="Transacciones Pendientes"
        value={pendingOrdersCount}
        icon={<Clock className="w-5 h-5 text-chart-3" />}
      />
    </div>
  )
}
