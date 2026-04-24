"use client"

import { useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

type RelatedProduct = {
  id: string
  name: string
  price: number
  image_url: string | null
}

type RelatedProductsCarouselProps = {
  products: RelatedProduct[]
}

export default function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="mt-16 px-4 sm:px-6 lg:px-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-foreground">Productos relacionados</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-input bg-card hover:bg-accent flex items-center justify-center transition"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-input bg-card hover:bg-accent flex items-center justify-center transition"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((rp) => (
          <Link
            key={rp.id}
            href={`/products/${rp.id}`}
            className="group bg-card rounded-xl border overflow-hidden hover:shadow-md transition flex-shrink-0 w-64"
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
                {formatPrice(rp.price)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
