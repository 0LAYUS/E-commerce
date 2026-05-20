import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/admin/DashboardClient';
import StoreSummaryCards from '@/components/admin/StoreSummaryCards';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';

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
      <h1 className="text-3xl font-bold text-foreground mb-8">Resumen de Tienda</h1>

      <StoreSummaryCards
        categoriesCount={currentCategories}
        productsCount={currentProducts}
        ordersCount={currentOrders}
      />

      <div className="mt-8">
        <DashboardClient />
      </div>

      <RecentOrdersTable orders={recentOrders || []} />
    </div>
  );
}
