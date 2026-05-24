import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SalesMetricCards from '@/features/admin/components/SalesMetricCards';
import { formatPrice } from '@/lib/format';
import { STATUS_BADGE_STYLES, STATUS_BADGE_DEFAULT } from '@/lib/constants/orders';

type OrderRow = {
  id: string
  total_amount: number
  status: string
  created_at: string
  wompi_transaction_id: string | null
  customer_name: string | null
  customer_email: string | null
  shipping_address: string | null
  profiles?: { email: string | null } | null
}

export default async function SalesPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      wompi_transaction_id,
      user_id,
      customer_name,
      customer_email,
      shipping_address,
      profiles (
        email
      )
    `)
    .order('created_at', { ascending: false });

  const approvedOrders = (orders as OrderRow[] | null)?.filter(o => o.status === 'APPROVED') || [];
  const totalIncome = approvedOrders.reduce((acc, curr) => acc + curr.total_amount, 0);
  const pendingOrders = (orders as OrderRow[] | null)?.filter(o => o.status === 'PENDING')?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Administración de Ventas</h1>

      <SalesMetricCards
        totalIncome={totalIncome}
        approvedOrdersCount={approvedOrders.length}
        pendingOrdersCount={pendingOrders}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Historial completo de Órdenes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ref ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Envío</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha / Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Pasarela</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(orders as OrderRow[] | null)?.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-foreground" title={order.id}>{order.id.slice(0, 8)}...</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1" title={order.wompi_transaction_id ?? undefined}>Wompi: {order.wompi_transaction_id ?? 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold">{order.customer_name || 'Sin Especificar'}</div>
                      <div className="text-sm text-muted-foreground">{order.customer_email || order.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm line-clamp-2 max-w-xs" title={order.shipping_address ?? undefined}>{order.shipping_address || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${STATUS_BADGE_STYLES[order.status] || STATUS_BADGE_DEFAULT}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                      {formatPrice(order.total_amount)}
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No se han registrado órdenes aún en la base de datos de tu tienda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
