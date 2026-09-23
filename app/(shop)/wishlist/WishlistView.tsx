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
      <div className="rounded-3xl bg-sand px-6 py-16 text-center">
        <p className="font-serif text-2xl">Nothing saved yet</p>
        <p className="text-muted mt-2">Your wishlist is saved on this device.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  // Keep the order people saved things in
  const ordered = wishlist.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as ProductSummary[];
  return <ProductGrid products={ordered} />;
}
