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
      aria-label={saved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={`grid size-9 place-items-center transition ${saved ? "!opacity-100" : ""} ${className}`}
    >
      <Heart size={18} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
