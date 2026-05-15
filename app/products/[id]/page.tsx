import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { getProductOptions, getProductVariants, getProductImages, getVariantImagesByProductId } from "@/lib/actions/productActions"
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
    .eq("archived", false)
    .single()

  if (!product) {
    notFound()
  }

  const [options, skus, productImages, variantImages] = await Promise.all([
    getProductOptions(id),
    getProductVariants(id),
    getProductImages(id),
    getVariantImagesByProductId(id),
  ])

  const { data: relatedProducts } = await supabase
    .from("products")
    .select("id, name, price, image_url")
    .eq("category_id", product.category_id)
    .eq("active", true)
    .eq("archived", false)
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
      productImages={productImages}
      variantImages={variantImages}
    />
  )
}

async function ArchivedProductPage({ productId }: { productId: string }) {
  const supabase = await createClient()

  // Fetch archived product details (admin can see it, this page is for customers who somehow access it)
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", productId)
    .single()

  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a productos
      </Link>

      {/* Archived notice */}
      <div className="bg-muted/50 border border-destructive/20 rounded-lg p-4 mb-8 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Este producto no está disponible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 opacity-60 grayscale pointer-events-none select-none">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden flex items-center justify-center border">
            {product.image_url ? (
              <div className="relative w-full h-full">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <span className="text-muted-foreground font-mono">Sin imagen</span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {product.categories?.name || "Sin categoría"}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-foreground mb-4">
            {product.name}
          </h1>

          <div className="mb-6">
            <span className="text-3xl font-extrabold text-primary">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(product.price)}
            </span>
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  )
}

