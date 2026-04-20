import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { getProductOptions, getProductVariants } from "@/lib/actions/productActions"
import ProductVariantSelector from "@/components/products/ProductVariantSelector"
import AddToCartButton from "@/components/products/AddToCartButton"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Try to fetch active product first
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .eq("active", true)
    .eq("archived", false)
    .single()

  // If not found, check if it exists and is archived (for showing grayed page)
  if (!product) {
    // Try to check if product exists at all (may be archived)
    const { data: archivedProduct } = await supabase
      .from("products")
      .select("id, archived")
      .eq("id", id)
      .single()

    // Product doesn't exist
    if (!archivedProduct) {
      notFound()
    }

    // Product exists but is not active (archived or hidden) — show grayed page
    if (archivedProduct.archived) {
      return <ArchivedProductPage productId={id} />
    }

    // Product exists but active=false (hidden by admin, not archived) — treat as not found
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
    .limit(4)

  const basePrice = product.price
  const hasVariants = options.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a productos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden flex items-center justify-center border">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
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
              }).format(basePrice)}
            </span>
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>

          {hasVariants && (
            <div className="mb-8">
              <ProductVariantSelector
                options={options}
                skus={skus}
                basePrice={basePrice}
                productId={product.id}
                productName={product.name}
              />
            </div>
          )}

          {!hasVariants && (
            <div className="mb-8">
              <div className="text-sm text-muted-foreground mb-2">Stock disponible</div>
              <div className="text-2xl font-bold text-foreground mb-4">{product.stock} unidades</div>
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                price={product.price}
                imageUrl={product.image_url}
                stock={product.stock}
              />
            </div>
          )}
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-foreground mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/products/${rp.id}`}
                className="group bg-card rounded-xl border overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square bg-muted flex items-center justify-center p-4">
                  {rp.image_url ? (
                    <img
                      src={rp.image_url}
                      alt={rp.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition"
                    />
                  ) : (
                    <span className="text-muted-foreground font-mono text-sm">IMG</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1 truncate">{rp.name}</h3>
                  <span className="text-primary font-extrabold">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(rp.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Separated component for archived product display
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
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
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
