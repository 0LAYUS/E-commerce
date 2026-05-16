"use client";

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none">
      <ShoppingCart className="w-6 h-6" />
      {mounted && itemCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 border-2 border-white rounded-full">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
