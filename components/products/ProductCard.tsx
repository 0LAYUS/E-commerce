"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PriceDisplay from "@/components/products/PriceDisplay";
import type { Product } from "@/types/product.types";

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

export default function ProductCard({ product, onAddToCart }: Props) {
  const router = useRouter();

  const hasStock =
    (product.stock && product.stock > 0) ||
    (product.effective_stock && product.effective_stock > 0);

  return (
    <div
      className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-2xl hover:border-foreground/20 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" weight="duotone" />
            </div>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {product.has_variants && (
          <Badge className="absolute top-3 left-3 shadow-md">Variantes</Badge>
        )}

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-xl border border-border">
            <MagnifyingGlass
              className="w-5 h-5 text-primary-foreground"
              weight="bold"
            />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="font-bold text-card-foreground group-hover:text-foreground transition-colors duration-200 line-clamp-2 text-sm leading-tight mb-2">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        <div className="flex items-start justify-between flex-col">
          <PriceDisplay price={product.price} />

          <Button
            variant={product.has_variants ? "secondary" : "default"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!hasStock}
          >
            {product.has_variants ? (
              "Ver"
            ) : (
              <>
                <Plus className="w-4 h-4" weight="bold" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
