import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/admin/DashboardClient';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: currentProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: currentCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: currentOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Resumen de Tienda</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-gray-500 font-medium">Categorías Activas</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{currentCategories || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-gray-500 font-medium">Total Productos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{currentProducts || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-gray-500 font-medium">Total Órdenes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{currentOrders || 0}</p>
        </div>
      </div>

      <div className="mt-8">
        <DashboardClient />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Órdenes Recientes</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(recentOrders || []).map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                      order.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay órdenes recientes
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
