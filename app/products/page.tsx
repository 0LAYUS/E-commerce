import { createClient } from "@/lib/supabase/server"
import ProductGrid from "./ProductGrid"

async function getProductsData() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: products } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
  const { data: optionTypes } = await supabase.from('product_option_types').select('product_id')
  const productsWithVariants = new Set(optionTypes?.map(o => o.product_id) || [])
  const productsWithVariantInfo = products?.map(p => ({
    ...p,
    hasVariants: productsWithVariants.has(p.id)
  })) || []
  return { categories: categories || [], products: productsWithVariantInfo }
}

export default async function ProductsPage() {
  const { categories, products } = await getProductsData()

  return <ProductGrid initialProducts={products} categories={categories} />
}