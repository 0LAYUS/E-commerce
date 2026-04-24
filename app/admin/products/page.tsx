import { createClient } from '@/lib/supabase/server';
import ProductGrid from '@/components/admin/ProductGrid';

export default async function ProductsPage() {
  const supabase = await createClient();
  
  // Fetch products (only non-archived)
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('archived', false)
    .order('created_at', { ascending: false });

  // Get variant stocks aggregated by product (only active variants)
  const { data: variantAggregates } = products && products.length > 0
    ? await supabase
        .from('product_skus')
        .select('product_id, stock')
        .in('product_id', products.map(p => p.id))
        .eq('active', true)
    : { data: [] };

  // Build lookup map: productId -> total variant stock
  const variantStockMap: Record<string, number> = {};
  if (variantAggregates) {
    for (const v of variantAggregates) {
      variantStockMap[v.product_id] = (variantStockMap[v.product_id] || 0) + v.stock;
    }
  }

  // Check which products have active variants
  const { data: optionTypes } = products && products.length > 0
    ? await supabase
        .from('product_option_types')
        .select('product_id')
        .in('product_id', products.map(p => p.id))
    : { data: [] };

  const productsWithVariants = new Set(optionTypes?.map(o => o.product_id) || []);

  // Add effective_stock to each product
  const enhancedProducts = products?.map(p => {
    const hasVariants = productsWithVariants.has(p.id);
    const effective_stock = hasVariants 
      ? (variantStockMap[p.id] || 0)
      : p.stock;
    return { ...p, effective_stock, has_variants: hasVariants };
  });

  const { data: categories } = await supabase.from('categories').select('*');

  return <ProductGrid products={enhancedProducts || []} categories={categories || []} />;
}
