import { createClient } from '@/lib/supabase/server';

export default async function SalesPage() {
  const supabase = await createClient();

  // Fetch all orders with user profile email
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

  // Calc basic metrics for the admin dashboard
  const approvedOrders = orders?.filter(o => o.status === 'APPROVED') || [];
  const totalIncome = approvedOrders.reduce((acc, curr) => acc + curr.total_amount, 0);
  const pendingOrders = orders?.filter(o => o.status === 'PENDING')?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Administración de Ventas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Ingresos Acumulados</h3>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalIncome)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Ventas Exitosas</h3>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{approvedOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Transacciones Pendientes</h3>
          <p className="text-3xl font-extrabold text-yellow-600 mt-2">{pendingOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Historial completo de Órdenes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Envío</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado Pasarela</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900" title={order.id}>{order.id.slice(0, 8)}...</div>
                    <div className="text-xs text-gray-500 font-mono mt-1" title={order.wompi_transaction_id}>Wompi: {order.wompi_transaction_id || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-bold">{order.customer_name || 'Sin Especificar'}</div>
                    <div className="text-sm text-gray-500">{order.customer_email || order.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 line-clamp-2 max-w-xs" title={order.shipping_address}>{order.shipping_address || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                      order.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                      order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      order.status === 'DECLINED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      order.status === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total_amount)}
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No se han registrado órdenes aún en la base de datos de tu tienda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
