"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BestSellerProduct {
  id: string
  name: string
  image_url: string | null
  total_sold: number
}

interface BestSellerCardProps {
  product: BestSellerProduct | null
  loading?: boolean
  className?: string
}

function SkeletonContent() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-md bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}

export function BestSellerCard({
  product,
  loading = false,
  className,
}: BestSellerCardProps) {
  const formatSold = (count: number): string => {
    return `${count} vendido${count !== 1 ? "s" : ""}`
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Mejor Producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonContent />
        ) : product ? (
          <div className="flex items-center gap-3">
            {product.image_url ? (
              <div className="relative w-12 h-12 rounded-md bg-muted overflow-hidden">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Sin imagen</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="font-medium text-sm text-foreground truncate"
                title={product.name}
              >
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSold(product.total_sold)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin ventas</p>
        )}
      </CardContent>
    </Card>
  )
}
