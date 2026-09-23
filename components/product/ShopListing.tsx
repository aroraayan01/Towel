import Link from "next/link";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs, PageHeader } from "@/components/ui";
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
  eyebrow,
  category,
  collection,
  searchParams,
  basePath,
}: {
  title: string;
  intro?: string;
  eyebrow?: string;
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

  const activeFilters = [
    q && { label: `“${q}”`, href: href({ q: undefined }) },
    colour && { label: colour, href: href({ colour: undefined }) },
    maxPrice && { label: PRICE_CAPS.find(([c]) => c === maxPrice)?.[1] ?? "Price", href: href({ max: undefined }) },
    inStock && { label: "In stock", href: href({ stock: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[];

  const siblings = COLLECTIONS.filter((c) => !category || c.category === category);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={q ? `Results for “${q}”` : title} intro={intro} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            ...(collection && category
              ? [{ href: `/shop/${category}`, label: CATEGORIES[category].name }]
              : [{ href: "/shop", label: "Shop" }]),
            { label: title },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-[15rem_1fr]">
          <aside aria-label="Filters" className="space-y-8 text-sm">
            <div>
              <h2 className="mb-3 font-sans text-sm font-bold tracking-wider uppercase">Collections</h2>
              <ul className="flex flex-wrap gap-2 lg:block lg:space-y-1">
                {siblings.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop/${c.slug}`}
                      className={`block rounded-full border px-3 py-1.5 lg:rounded-lg lg:border-0 lg:px-2 ${
                        c.slug === collection ? "border-gum bg-gum-light font-semibold text-gum-dark" : "border-line hover:bg-sand"
                      }`}
                      aria-current={c.slug === collection ? "page" : undefined}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-sans text-sm font-bold tracking-wider uppercase">Colour</h2>
              <ul className="flex flex-wrap gap-2">
                {colours.map((c) => {
                  const active = colour?.toLowerCase() === c.colourName.toLowerCase();
                  return (
                    <li key={c.colourName}>
                      <Link
                        href={href({ colour: active ? undefined : c.colourName })}
                        title={c.colourName}
                        aria-label={`${active ? "Remove" : "Filter by"} colour ${c.colourName}`}
                        className={`block size-8 rounded-full border-2 transition hover:scale-110 ${
                          active ? "border-ink ring-2 ring-ink ring-offset-2" : "border-white shadow"
                        }`}
                        style={{ background: c.colourHex }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-sans text-sm font-bold tracking-wider uppercase">Price</h2>
              <ul className="flex flex-wrap gap-2">
                {PRICE_CAPS.map(([cap, label]) => (
                  <li key={cap}>
                    <Link
                      href={href({ max: maxPrice === cap ? undefined : String(cap) })}
                      className={`block rounded-full border px-3 py-1.5 ${
                        maxPrice === cap ? "border-gum bg-gum-light font-semibold" : "border-line hover:bg-sand"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link href={href({ stock: inStock ? undefined : "1" })} className="flex items-center gap-2" aria-pressed={inStock}>
                <span
                  className={`grid size-5 place-items-center rounded border-2 text-xs ${
                    inStock ? "border-gum bg-gum text-white" : "border-line bg-white"
                  }`}
                  aria-hidden
                >
                  {inStock && "✓"}
                </span>
                Hide sold-out items
              </Link>
            </div>
          </aside>

          <section aria-label="Products">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted text-sm" aria-live="polite">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
              <Suspense>
                <SortSelect value={sort} />
              </Suspense>
            </div>

            {activeFilters.length > 0 && (
              <ul className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                {activeFilters.map((f) => (
                  <li key={f.label}>
                    <Link href={f.href} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-white hover:bg-ink/80">
                      {f.label} <span aria-hidden>×</span>
                      <span className="sr-only">remove filter</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={basePath} className="underline underline-offset-4">
                    Clear all
                  </Link>
                </li>
              </ul>
            )}

            {products.length ? (
              <ProductGrid products={products} />
            ) : (
              <div className="rounded-2xl bg-sand px-6 py-16 text-center">
                <p className="font-serif text-2xl">Nothing matches that just yet</p>
                <p className="text-muted mt-2">Try removing a filter, or have a look at everything.</p>
                <Link href="/shop" className="btn btn-primary mt-6">
                  Shop all
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
