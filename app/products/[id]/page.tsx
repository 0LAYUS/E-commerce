import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
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

// Formato de precio en COP
const formatCOP = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount)

// -------------------------------------------------------
// Metadata dinámica: Google + WhatsApp / redes sociales
// -------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_url, price")
    .eq("id", id)
    .eq("active", true)
    .single()

  if (!product) {
    return { title: "Producto no encontrado" }
  }

  const priceLabel = formatCOP(product.price)
  // Descripción corta para metas (máx 160 caracteres)
  const shortDesc = product.description
    ? `${product.description.slice(0, 120).trimEnd()}... ${priceLabel} — Envío a toda Colombia.`
    : `${priceLabel} — Envío a toda Colombia.`

  return {
    // Usa el template "%s | Prigma Comercio" definido en layout.tsx
    title: product.name,
    description: shortDesc,
    openGraph: {
      title: `${product.name} — ${priceLabel}`,
      description: shortDesc,
      ...(product.image_url && {
        images: [
          {
            url: product.image_url,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${priceLabel}`,
      description: shortDesc,
      ...(product.image_url && { images: [product.image_url] }),
    },
  }
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