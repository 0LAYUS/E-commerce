"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/shared/components/CartProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import QuantitySelector from "./QuantitySelector";

type Props = {
  productId: string;
  productName: string;
  price: number;
  imageUrl?: string;
  stock: number;
  variantId?: string;
  skuCode?: string;
};

export default function AddToCartButton({
  productId,
  productName,
  price,
  imageUrl,
  stock,
  variantId,
  skuCode,
}: Props) {
  const { addItem } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = useCallback(async () => {
    if (stock === 0) return;

    setError(null);
    setLoading(true);
    try {
      const result = await addItem({
        id: variantId || productId,
        product_id: productId,
        variant_id: variantId,
        name: productName,
        price,
        imageUrl,
        sku_code: skuCode,
      });
      if (!result.success && result.error) {
        setError(result.error);
        setTimeout(() => setError(null), 4000);
      } else {
        setQuantity(1);
      }
    } finally {
      setLoading(false);
    }
  }, [
    addItem,
    productId,
    variantId,
    productName,
    price,
    imageUrl,
    skuCode,
    stock,
  ]);

  if (stock === 0) {
    return (
      <Button disabled className="w-full py-6 text-lg font-bold">
        Agotado
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <QuantitySelector
        quantity={quantity}
        maxStock={stock}
        onQuantityChange={setQuantity}
      />
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        onClick={handleAddToCart}
        variant="ghost"
        disabled={loading}
        className="w-full py-6 text-lg font-bold shadow-sm"
      >
        {loading ? "Agregando..." : "Añadir al carrito"}
      </Button>
    </div>
  );
}
