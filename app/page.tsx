import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import HomeContent from "./HomeContent"

async function getProductsData() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: products } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
  const { data: optionTypes } = await supabase
    .from('product_option_types')
    .select('product_id')
    .in('product_id', products?.map(p => p.id) || [])
  const productsWithVariants = new Set(optionTypes?.map(o => o.product_id) || [])
  const productsWithVariantInfo = products?.map(p => ({
    ...p,
    hasVariants: productsWithVariants.has(p.id)
  })) || []
  return { categories: categories || [], products: productsWithVariantInfo }
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="w-full bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
          <div className="flex-1 h-12 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="w-full bg-white border-b px-6 py-4">
        <div className="flex gap-2 max-w-screen-2xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-6 max-w-screen-2xl mx-auto w-full bg-gray-50">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
              <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Suspense fallback={<LoadingSkeleton />}>
        <HomeContent categories={categories} products={products} />
      </Suspense>
    </div>
  )
}