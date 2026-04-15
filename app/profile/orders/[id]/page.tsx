import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Inicia sesión para ver.</div>;
  }

  // Fetch order and its items
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_at_purchase,
        products (
          name,
          image_url
        )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8 mb-20">
      <Link href="/profile/orders" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
      </Link>

      {/* MAIN CARD 1 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-8 mb-8">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-extrabold text-gray-900">Orden #{order.id.split('-')[0]}</h1>
          <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
            order.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            order.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {order.status === 'PENDING' ? 'Procesando' : order.status === 'APPROVED' ? 'Aprobado' : order.status}
          </span>
        </div>
        <p className="text-gray-500 mb-8">
          Realizada el {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informacion Envío */}
          <div>
            <h3 className="flex items-center text-gray-900 font-bold mb-4">
              <Package className="w-5 h-5 mr-2 text-blue-400" /> Información de Envío
            </h3>
            <div className="text-gray-600 space-y-1">
              <p>{order.customer_name || 'N/A'}</p>
              <p>{order.customer_email || 'N/A'}</p>
              <p className="mt-2 text-sm">{order.shipping_address || 'N/A'}</p>
            </div>
          </div>
          
          {/* Resumen */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total_amount)}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between items-center pt-2">
                <span className="font-extrabold text-gray-900 text-lg">Total</span>
                <span className="font-extrabold text-blue-500 text-lg">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD 2 (Productos) */}
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Productos</h2>
      <div className="space-y-4">
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="relative flex p-4 bg-white rounded-xl shadow-sm border items-center">
            {/* Image */}
            <div className="flex-shrink-0 w-20 h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
              {item.products?.image_url ? (
                <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <span className="text-xs text-gray-400 font-mono">IMG</span>
              )}
            </div>

            {/* Info */}
            <div className="ml-6 flex-1">
              <h3 className="text-base font-bold text-gray-900">{item.products?.name || 'Producto Desconocido'}</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Cantidad: {item.quantity}</p>
            </div>

            {/* Price */}
            <div className="text-right flex flex-col justify-center">
              <p className="font-extrabold text-gray-900 text-lg">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price_at_purchase)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price_at_purchase * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
