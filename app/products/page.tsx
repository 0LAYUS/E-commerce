import { createClient } from "@/lib/supabase/server"
import ProductGrid from "@/components/products/ProductGrid"

async function getProductsData() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: products } = await supabase.from('products').select('*').eq('active', true).eq('archived', false).order('created_at', { ascending: false })
  const { data: optionTypes } = await supabase.from('product_option_types').select('product_id')
  const productsWithVariants = new Set(optionTypes?.map(o => o.product_id) || [])

  // Obtener stock efectivo de productos con variantes (mismo patrón que admin)
  const productIds = products?.map(p => p.id) || []
  const variantStockMap = {} as Record<string, number>
  if (productIds.length > 0) {
    const { data: variantAggregates } = await supabase
      .from('product_skus')
      .select('product_id, stock')
      .in('product_id', productIds)
      .eq('active', true)

    if (variantAggregates) {
      for (const v of variantAggregates) {
        variantStockMap[v.product_id] = (variantStockMap[v.product_id] || 0) + v.stock
      }
    }
  }

  const productsWithVariantInfo = products?.map(p => ({
    ...p,
    hasVariants: productsWithVariants.has(p.id),
    effective_stock: variantStockMap[p.id] ?? p.stock
  })) || []
  return { categories: categories || [], products: productsWithVariantInfo }
}

export default async function ProductsPage() {
  const { categories, products } = await getProductsData()

  return <ProductGrid initialProducts={products} categories={categories} />
}