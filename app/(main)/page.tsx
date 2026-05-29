import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import HomeContent from "@/features/home/components/HomeContent"

export const dynamic = 'force-dynamic'

async function getProductsData() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: products } = await supabase.from('products').select('*').eq('active', true).eq('archived', false).order('created_at', { ascending: false })
  const { data: optionTypes } = await supabase
    .from('product_option_types')
    .select('product_id')
    .in('product_id', products?.map(p => p.id) || [])
  const productsWithVariants = new Set(optionTypes?.map(o => o.product_id) || [])

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
    has_variants: productsWithVariants.has(p.id),
    effective_stock: variantStockMap[p.id] ?? p.stock
  })) || []
  return { categories: categories || [], products: productsWithVariantInfo }
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="w-full bg-card px-6 py-4">
        <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
          <div className="flex-1 h-12 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
      <div className="w-full bg-card border-b border-border px-6 py-4">
        <div className="flex gap-2 max-w-screen-2xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-6 max-w-screen-2xl mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="aspect-square bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function Index() {
  const { categories, products } = await getProductsData()

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<LoadingSkeleton />}>
        <HomeContent categories={categories} products={products} />
      </Suspense>
    </div>
  )
}
