import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type Category = {
  id: number
  name: string
}

type Variant = {
  id: number
  product_id: number
  sku_code: string
  price_override: number | null
  stock: number
  active: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("category_id") || ""

    const supabase = await createClient()

    let query = supabase
      .from("products")
      .select("id, name, description, price, stock, image_url, active, category_id")
      .eq("active", true)

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data: products, error } = await query.order("name").limit(50)

    if (error) {
      console.error("POS products error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const productIds = products.map((p) => p.id)

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")

    const categoryMap = new Map<Category, Category>(categories?.map((c) => [c.id, c]) || [])

    const { data: allVariants } = await supabase
      .from("product_skus")
      .select("id, product_id, sku_code, price_override, stock, active")
      .in("product_id", productIds)
      .eq("active", true)

    const variantsMap = new Map<number, Variant[]>()
    allVariants?.forEach((v) => {
      if (!variantsMap.has(v.product_id)) {
        variantsMap.set(v.product_id, [])
      }
      variantsMap.get(v.product_id)!.push(v)
    })

    const productsWithData = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      image_url: p.image_url,
      active: p.active,
      category_id: p.category_id,
      category: categoryMap.get(p.category_id) || null,
      variants: variantsMap.get(p.id) || [],
    }))

    return NextResponse.json({ products: productsWithData })
  } catch (error) {
    console.error("POS products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
