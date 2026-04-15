import { createClient } from '@/lib/supabase/server';
import CategoryGrid from '@/components/admin/CategoryGrid';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('*, products(id)')
    .order('created_at', { ascending: false });

  return <CategoryGrid categories={categories || []} />;
}
