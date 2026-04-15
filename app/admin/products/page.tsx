import { createClient } from '@/lib/supabase/server';
import ProductGrid from '@/components/admin/ProductGrid';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
  const { data: categories } = await supabase.from('categories').select('*');

  return <ProductGrid products={products || []} categories={categories || []} />;
}
