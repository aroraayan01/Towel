import Link from "next/link";

import { Photo } from "@/components/Photo";
import { PriceTag } from "@/components/ui";
import type { ProductSummary } from "@/lib/products";
import { WishlistButton } from "./WishlistButton";

const GRID_SIZES = "(min-width: 1024px) 25vw, 50vw";

export function ProductCard({ p, preload }: { p: ProductSummary; preload?: boolean }) {
  const label = !p.inStock ? "Sold out" : p.compareAtCents ? "Sale" : p.isNew ? "New" : null;

  return (
    <article className="group relative">
      <Link href={`/products/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-bone">
          <Photo src={p.image} alt={p.imageAlt} sizes={GRID_SIZES} preload={preload} />
          {p.hoverImage && (
            <Photo src={p.hoverImage} alt="" sizes={GRID_SIZES} className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
          {label && <span className="caps absolute left-3 top-3 bg-white px-2 py-1 !text-[10px]">{label}</span>}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 text-[14px]">
          <h3 className="font-normal">
            {p.name}
            {p.maker && <span className="mt-0.5 block text-[12px] text-grey">by {p.maker.name}</span>}
          </h3>
          <PriceTag className="shrink-0" cents={p.minPriceCents} compareAt={p.compareAtCents} from={p.minPriceCents !== p.maxPriceCents} />
        </div>
        {p.colours.length > 1 && (
          <p className="mt-1.5 flex items-center gap-2 text-[13px] text-grey">
            <span className="flex gap-1" aria-hidden>
              {p.colours.slice(0, 5).map((c) => (
                <span key={c.name} className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
              ))}
            </span>
            {p.colours.length} colours
          </p>
        )}
      </Link>
      <WishlistButton slug={p.slug} name={p.name} className="absolute right-2 top-2 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100" />
    </article>
  );
}

export function ProductGrid({ products, eager = 0 }: { products: ProductSummary[]; eager?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} preload={i < eager} />
      ))}
    </div>
  );
}
