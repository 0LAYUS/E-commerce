"use client"

import { useEffect, useMemo, useState, type TouchEvent } from "react"
import Image from "next/image"
import { ShoppingBag, CaretLeft, CaretRight } from "@phosphor-icons/react"
import type { GalleryImage } from "@/features/products/types/product.types"

type ExtendedImage = GalleryImage & { skuId?: string }

type Props = {
  images: ExtendedImage[]
  productName: string
  selectedSkuId?: string | null
  onImageSelect?: (skuId: string | undefined) => void
  scrollToIndex?: number
}

export default function ProductImageGallery({ images, productName, selectedSkuId, onImageSelect, scrollToIndex }: Props) {
  const normalized = useMemo(
    () => images.filter((img) => img.url),
    [images]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [normalized.length])

  useEffect(() => {
    if (scrollToIndex !== undefined && scrollToIndex >= 0) {
      setActiveIndex(scrollToIndex)
    }
  }, [scrollToIndex])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? normalized.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === normalized.length - 1 ? 0 : prev + 1))
  }

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStart(event.touches[0]?.clientX ?? null)
  }

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStart
    const delta = touchStart - endX
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    setTouchStart(null)
  }

  if (normalized.length === 0) {
    return (
      <div className="aspect-square bg-card rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-xl">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <ShoppingBag className="w-20 h-20" weight="duotone" />
          <span className="text-sm">Sin imagen</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className="aspect-square bg-card rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-xl relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {normalized.map((img, index) => (
            <div
              key={img.id ?? `${img.url}-${index}`}
              className="h-full w-full shrink-0 relative cursor-pointer"
              onClick={() => {
                const imgSkuId = (img as ExtendedImage).skuId
                if (imgSkuId) {
                  onImageSelect?.(imgSkuId)
                } else if (selectedSkuId) {
                  onImageSelect?.(undefined)
                }
              }}
            >
              <Image
                src={img.url}
                alt={img.alt || productName}
                fill
                className="object-contain p-8"
                draggable={false}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
        {normalized.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 border border-border shadow-sm absolute left-4 top-1/2 -translate-y-1/2 hover:bg-background transition"
              aria-label="Imagen anterior"
            >
              <CaretLeft className="w-5 h-5" weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 border border-border shadow-sm absolute right-4 top-1/2 -translate-y-1/2 hover:bg-background transition"
              aria-label="Siguiente imagen"
            >
              <CaretRight className="w-5 h-5" weight="bold" />
            </button>
          </>
        )}
        {normalized.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {normalized.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === activeIndex ? "bg-foreground" : "bg-muted-foreground/40"
                }`}
                aria-label={`Imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {normalized.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {normalized.map((img, index) => {
            const isVariantImage = !!(img as ExtendedImage).skuId
            const isSelectedVariant = isVariantImage && (img as ExtendedImage).skuId === selectedSkuId
            return (
              <button
                key={img.id ?? `${img.url}-${index}`}
                type="button"
                onClick={() => {
                  setActiveIndex(index)
                  const imgSkuId = (img as ExtendedImage).skuId
                  if (imgSkuId) {
                    onImageSelect?.(imgSkuId)
                  } else if (selectedSkuId) {
                    onImageSelect?.(undefined)
                  }
                }}
                className={`aspect-square rounded-xl border overflow-hidden bg-card flex items-center justify-center relative transition ${
                  index === activeIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : isSelectedVariant
                      ? "border-primary/60"
                      : "border-border hover:border-primary/60"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || productName}
                  fill
                  className="object-contain p-2"
                  sizes="20vw"
                />
                {isVariantImage && (
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isSelectedVariant ? "bg-primary" : "bg-muted-foreground/50"
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
