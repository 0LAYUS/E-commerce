import { formatPrice } from "@/lib/format"
import { RECENT_ORDER_STATUS_STYLES, RECENT_ORDER_STATUS_DEFAULT } from "@/lib/constants/orders"

type RecentOrdersTableProps = {
  orders: Array<{
    id: string
    status: string
    total_amount: number
    created_at: string
  }>
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const getStatusStyle = (status: string) => {
    return RECENT_ORDER_STATUS_STYLES[status] || RECENT_ORDER_STATUS_DEFAULT
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4 text-[var(--text-secondary)]">Órdenes Recientes</h2>
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--bg-surface-muted)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">ID Orden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)] font-mono">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)] font-medium">
                  {formatPrice(order.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-[var(--text-muted)]">
                  No hay órdenes recientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
