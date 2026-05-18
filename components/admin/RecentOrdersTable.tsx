import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import { STATUS_BADGE_STYLES, STATUS_BADGE_DEFAULT } from "@/lib/constants/orders"

type RecentOrdersTableProps = {
  orders: Array<{
    id: string
    status: string
    total_amount: number
    created_at: string
  }>
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full border ${STATUS_BADGE_STYLES[order.status] || STATUS_BADGE_DEFAULT}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    No hay órdenes recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
