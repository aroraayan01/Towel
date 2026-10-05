import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/ProductCard";
import { PageTitle } from "@/components/ui";
import { CATEGORIES, COLLECTIONS, type Category } from "@/lib/collections";
import { allColours, listProducts, type SortKey } from "@/lib/products";
import { SortSelect } from "./SortSelect";

type Params = { [k: string]: string | string[] | undefined };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const PRICE_CAPS = [
  [5000, "Under $50"],
  [10000, "Under $100"],
  [30000, "Under $300"],
  [60000, "Under $600"],
] as const;

export async function ShopListing({
  title,
  intro,
  category,
  collection,
  searchParams,
  basePath,
}: {
  title: string;
  intro?: string;
  category?: Category;
  collection?: string;
  searchParams: Params;
  basePath: string;
}) {
  const q = one(searchParams.q)?.slice(0, 80);
  const colour = one(searchParams.colour);
  const sort = (one(searchParams.sort) ?? "featured") as SortKey;
  const maxPrice = Number(one(searchParams.max)) || undefined;
  const inStock = one(searchParams.stock) === "1";

  const [products, colours] = await Promise.all([
    listProducts({ category, collection, q, colour, sort, maxPrice, inStock }),
    allColours(category),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = {
      q,
      colour,
      sort: sort === "featured" ? undefined : sort,
      max: maxPrice ? String(maxPrice) : undefined,
      stock: inStock ? "1" : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const active = [
    q && { label: `"${q}"`, href: href({ q: undefined }) },
    colour && { label: colour, href: href({ colour: undefined }) },
    maxPrice && { label: PRICE_CAPS.find(([c]) => c === maxPrice)?.[1] ?? "Price", href: href({ max: undefined }) },
    inStock && { label: "In stock", href: href({ stock: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[];

  const tabs = COLLECTIONS.filter((c) => !category || c.category === category);
  const crumbs = [
    { href: "/", label: "Home" },
    ...(collection && category ? [{ href: `/shop/${category}`, label: CATEGORIES[category].name }] : []),
    { label: q ? "Search" : title },
  ];

  return (
    <>
      <PageTitle title={q ? `Search: ${q}` : title} intro={q ? undefined : intro} crumbs={crumbs} />

      <div className="page-x">
        {/* Collection tabs */}
        <nav aria-label="Collections" className="no-scrollbar -mx-5 flex gap-6 overflow-x-auto border-b border-line px-5 text-[14px] md:mx-0 md:px-0">
          {!collection && (
            <span className="shrink-0 border-b border-ink pb-3" aria-current="page">
              All
            </span>
          )}
          {collection && category && (
            <Link href={`/shop/${category}`} className="shrink-0 pb-3 text-grey hover:text-ink">
              All
            </Link>
          )}
          {tabs.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              aria-current={c.slug === collection ? "page" : undefined}
              className={`shrink-0 pb-3 ${c.slug === collection ? "border-b border-ink" : "text-grey hover:text-ink"}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-[14px]">
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown label="Colour" active={!!colour}>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                {colours.map((c) => {
                  const on = colour?.toLowerCase() === c.colourName.toLowerCase();
                  return (
                    <li key={c.colourName}>
                      <Link href={href({ colour: on ? undefined : c.colourName })} className={`flex items-center gap-2 ${on ? "font-medium" : ""}`}>
                        <span className="size-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: c.colourHex }} />
                        {c.colourName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Dropdown>
            <Dropdown label="Price" active={!!maxPrice}>
              <ul className="space-y-2">
                {PRICE_CAPS.map(([cap, label]) => (
                  <li key={cap}>
                    <Link href={href({ max: maxPrice === cap ? undefined : String(cap) })} className={maxPrice === cap ? "font-medium" : ""}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Dropdown>
            <Link href={href({ stock: inStock ? undefined : "1" })} className={`border px-3 py-2 ${inStock ? "border-ink" : "border-line hover:border-ink"}`} aria-pressed={inStock}>
              In stock only
            </Link>
            {active.map((f) => (
              <Link key={f.label} href={f.href} className="flex items-center gap-1.5 bg-bone px-3 py-2 hover:bg-stone">
                {f.label} <span aria-hidden>×</span>
                <span className="sr-only">(remove filter)</span>
              </Link>
            ))}
            {active.length > 0 && (
              <Link href={basePath} className="link ml-1 text-grey">
                Clear
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-grey" aria-live="polite">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          </div>
        </div>

        <div className="pb-20 pt-4">
          {products.length ? (
            <ProductGrid products={products} eager={4} />
          ) : (
            <div className="border-t border-line py-20 text-center">
              {active.length ? (
                <>
                  <p className="text-lg">No products match those filters.</p>
                  <Link href={basePath} className="btn btn-line mt-6">
                    Clear filters
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg">Nothing here just yet.</p>
                  <Link href="/shop" className="btn btn-line mt-6">
                    Shop everything
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Dropdown({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  return (
    <details className="group relative">
      <summary className={`flex cursor-pointer list-none items-center gap-2 border px-3 py-2 [&::-webkit-details-marker]:hidden ${active ? "border-ink" : "border-line hover:border-ink"}`}>
        {label}
        <ChevronDown size={14} strokeWidth={1.5} className="transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 min-w-56 border border-line bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {children}
      </div>
    </details>
  );
}
