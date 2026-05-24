import { TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import type { SummaryData } from "@/types/pos.types"

type POSMetricCardsProps = {
  summary: SummaryData | null
}

export default function POSMetricCards({ summary }: POSMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ventas de Hoy
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.total_sales || 0}</div>
          <p className="text-xs text-muted-foreground">
            {formatPrice(summary?.total_amount || 0)} en ventas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ticket Promedio
          </CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(summary?.avg_ticket || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Por venta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Efectivo Recibido
          </CardTitle>
          <DollarSign className="w-4 h-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatPrice(summary?.efectivo_cash_in || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            En caja hoy
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Acumulado
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(summary?.total_amount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Ventas del día
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
