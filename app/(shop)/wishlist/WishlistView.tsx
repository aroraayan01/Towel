"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { ProductGrid } from "@/components/product/ProductCard";
import type { ProductSummary } from "@/lib/products";
import { wishlistProducts } from "./actions";

export function WishlistView() {
  const { wishlist, ready } = useCart();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    wishlistProducts(wishlist).then((p) => live && setProducts(p));
    return () => {
      live = false;
    };
  }, [wishlist, ready]);

  if (!products) return <div className="min-h-64" aria-busy />;

  if (products.length === 0) {
    return (
      <div className="border-t border-line py-20 text-center">
        <p>Nothing saved yet. Tap the heart on a product to save it here.</p>
        <Link href="/shop" className="btn btn-dark mt-6">
          Shop all
        </Link>
      </div>
    );
  }

  // Keep the order people saved things in
  const ordered = wishlist.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as ProductSummary[];
  return <ProductGrid products={ordered} />;
}
