import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default async function ProfileOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Inicia sesión para ver tus órdenes.</div>;
  }

  // Fetch orders with order_items to count distinct line items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items ( id )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Mis Compras</h1>
      
      <div className="space-y-6">
        {orders?.map(order => {
          const productCount = order.order_items?.length || 0;
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Orden #{order.id.split('-')[0]}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-4 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  order.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status === 'PENDING' ? 'Procesando' : order.status === 'APPROVED' ? 'Aprobado' : order.status}
                </span>
              </div>
              
              <hr className="border-gray-100 my-4" />
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{productCount} producto(s)</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total_amount)}
                  </p>
                </div>
                <Link href={`/profile/orders/${order.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-white border rounded-lg text-sm font-semibold hover:bg-gray-50 transition border-gray-200 text-gray-700 shadow-sm">
                  <Eye className="w-4 h-4 text-gray-500" /> Ver Detalles
                </Link>
              </div>
            </div>
          )
        })}
        
        {(!orders || orders.length === 0) && (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm border">
            Aún no has realizado ninguna orden en tu cuenta.
          </div>
        )}
      </div>
    </div>
  );
}
