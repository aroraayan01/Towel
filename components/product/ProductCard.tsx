import Link from "next/link";

import { TextileArt } from "@/components/TextileArt";
import { PriceTag, Stars } from "@/components/ui";
import type { ProductSummary } from "@/lib/products";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ p }: { p: ProductSummary }) {
  const first = p.colours[0];
  const badge = !p.inStock
    ? { label: "Sold out", cls: "bg-ink text-white" }
    : p.compareAtCents
      ? { label: "Sale", cls: "bg-clay text-white" }
      : p.isNew
        ? { label: "New", cls: "bg-wattle text-ink" }
        : p.bestseller
          ? { label: "Bestseller", cls: "bg-white text-ink" }
          : null;

  return (
    <article className="group relative">
      <Link href={`/products/${p.slug}`} className="block" aria-label={p.name}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
          <TextileArt
            category={p.category}
            collection={p.collection}
            pattern={p.pattern}
            colour={first.hex}
            accent={first.accent}
            imageUrl={p.imageUrl}
            alt={`${p.name} in ${first.name}`}
            className="transition duration-500 group-hover:scale-[1.03]"
          />
          {p.collection !== "bath-mats" && !p.imageUrl && (
            <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden>
              <TextileArt
                category={p.category}
                collection={p.collection}
                pattern={p.pattern}
                colour={first.hex}
                accent={first.accent}
                view="alt"
                alt=""
              />
            </div>
          )}
          {badge && (
            <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>
      </Link>
      <WishlistButton slug={p.slug} name={p.name} className="absolute right-3 top-3" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-base leading-snug font-semibold">
            <Link href={`/products/${p.slug}`} className="hover:underline underline-offset-4">
              {p.name}
            </Link>
          </h3>
          {p.rating !== null && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Stars rating={p.rating} size={12} />
              <span>({p.reviewCount})</span>
            </p>
          )}
        </div>
        <p className="shrink-0 font-semibold">
          <PriceTag cents={p.minPriceCents} compareAt={p.compareAtCents} from={p.minPriceCents !== p.maxPriceCents} />
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Available colours">
        {p.colours.map((c) => (
          <li key={c.name} title={c.name} className="size-4 rounded-full border border-black/10" style={{ background: c.hex }}>
            <span className="sr-only">{c.name}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
