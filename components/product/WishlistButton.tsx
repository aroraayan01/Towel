"use client";

import { Heart } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";

export function WishlistButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { wishlist, toggleWish, ready } = useCart();
  const saved = ready && wishlist.includes(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleWish(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`grid size-10 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${className}`}
    >
      <Heart size={18} className={saved ? "text-clay" : "text-ink"} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
