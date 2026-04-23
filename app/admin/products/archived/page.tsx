import { createAdminClient } from "@/lib/supabase/admin"
import ArchivedProductsGrid from "@/components/admin/ArchivedProductsGrid"

export default async function ArchivedProductsPage() {
  const supabase = await createAdminClient()

  // Step 1: Get archived products
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, stock, image_url, category_id, active, archived, created_at")
    .eq("archived", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching archived products:", error)
    return <ArchivedProductsGrid products={[]} />
  }

  // Step 2: Get categories for these products
  const categoryIds = products?.map(p => p.category_id).filter(Boolean) || []
  const { data: categories } = categoryIds.length > 0
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] }

  const categoryMap = new Map(categories?.map(c => [c.id, c]) || [])

  // Step 3: Attach category info (handle null categories)
  const productsWithCategories = products?.map(p => ({
    ...p,
    categories: categoryMap.get(p.category_id) || undefined
  })) || []

  return <ArchivedProductsGrid products={productsWithCategories} />
}
