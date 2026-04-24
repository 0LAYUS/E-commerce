import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "@phosphor-icons/react"
import { getProductOptions, getProductVariants } from "@/lib/actions/productActions"
import ProductVariantSelector from "@/components/products/ProductVariantSelector"
import AddToCartButton from "@/components/products/AddToCartButton"
import RelatedProductsCarousel from "@/components/products/RelatedProductsCarousel"
import ProductDetailClient from "./ProductDetailClient"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .eq("active", true)
    .single()

  if (!product) {
    notFound()
  }

  const [options, skus] = await Promise.all([
    getProductOptions(id),
    getProductVariants(id),
  ])

  const { data: relatedProducts } = await supabase
    .from("products")
    .select("id, name, price, image_url")
    .eq("category_id", product.category_id)
    .eq("active", true)
    .neq("id", id)
    .limit(8)

  const basePrice = product.price
  const hasVariants = options.length > 0

  return (
    <ProductDetailClient
      product={product}
      options={options}
      skus={skus}
      basePrice={basePrice}
      hasVariants={hasVariants}
      relatedProducts={relatedProducts || []}
    />
  )
}