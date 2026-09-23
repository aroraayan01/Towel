import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { ReviewForm } from "@/components/forms/ReviewForm";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs, Stars } from "@/components/ui";
import { CATEGORIES, collectionBySlug, type Category } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { getProduct, relatedProducts } from "@/lib/products";
import { store } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const from = Math.min(...p.variants.map((v) => v.priceCents));
  return {
    title: p.name,
    description: `${p.tagline} From ${formatPrice(from)}. ${p.material}. Free shipping over ${formatPrice(store.commerce.freeShippingThresholdCents)} Australia-wide.`,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.tagline, type: "website" },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const { colour } = await searchParams;
  const p = await getProduct(slug);
  if (!p) notFound();

  const related = await relatedProducts(p.id, p.collection, p.category);
  const collection = collectionBySlug(p.collection);
  const details: string[] = JSON.parse(p.details);
  const rating = p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({ n, count: p.reviews.filter((r) => r.rating === n).length }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    material: p.material,
    brand: { "@type": "Brand", name: store.name },
    url: `${store.url}/products/${p.slug}`,
    // Google needs a real photo for product rich results — set imageUrl on the product
    ...(p.imageUrl && { image: p.imageUrl }),
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: `${p.name} — ${v.colourName}, ${v.size}`,
      price: (v.priceCents / 100).toFixed(2),
      priceCurrency: "AUD",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "AU",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: store.commerce.returnDays,
      },
    })),
    ...(rating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: p.reviews.length },
      review: p.reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating },
        author: { "@type": "Person", name: r.name },
        name: r.title,
        reviewBody: r.body,
      })),
    }),
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: `/shop/${p.category}`, label: CATEGORIES[p.category as Category]?.name ?? "Shop" },
          ...(collection ? [{ href: `/shop/${collection.slug}`, label: collection.name }] : []),
          { label: p.name },
        ]}
      />

      <div className="mt-6">
        <ProductBuyBox
          initialColour={typeof colour === "string" ? colour : undefined}
          product={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            tagline: p.tagline,
            category: p.category,
            collection: p.collection,
            pattern: p.pattern,
            imageUrl: p.imageUrl,
            monogramable: p.monogramable,
            isNew: p.isNew,
            bestseller: p.bestseller,
            rating,
            reviewCount: p.reviews.length,
            variants: p.variants.map((v) => ({
              id: v.id,
              colourName: v.colourName,
              colourHex: v.colourHex,
              accentHex: v.accentHex,
              size: v.size,
              priceCents: v.priceCents,
              compareAtCents: v.compareAtCents,
              stock: v.stock,
            })),
          }}
        />
      </div>

      {/* ── Story & details ─────────────────────────── */}
      <section className="mt-16 grid gap-10 border-t border-line pt-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl sm:text-3xl">The story</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#463f39]">{p.description}</p>
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          <Accordion title="Details" open>
            <ul className="space-y-2">
              {details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-gum" aria-hidden>✓</span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <strong>Material:</strong> {p.material}
            </p>
          </Accordion>
          <Accordion title="Care instructions">
            <p>{p.care}</p>
            <p className="mt-2">
              More tips in our <a href="/care-guide" className="underline">care guide</a>.
            </p>
          </Accordion>
          <Accordion title="Shipping & returns">
            <p>
              Orders ship from our warehouse within 1–2 business days. Standard delivery takes 2–9 business days depending on
              where you are, and it&apos;s free on orders over {formatPrice(store.commerce.freeShippingThresholdCents)}.
            </p>
            <p className="mt-2">
              Changed your mind? Return unused items within {store.commerce.returnDays} days. Faulty items are always covered
              under Australian Consumer Law. <a href="/returns" className="underline">Full returns policy</a>.
            </p>
          </Accordion>
        </div>
      </section>

      {/* ── Reviews ─────────────────────────────────── */}
      <section id="reviews" className="mt-16 scroll-mt-28 border-t border-line pt-12">
        <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="text-2xl sm:text-3xl">Reviews</h2>
            {rating !== null ? (
              <>
                <p className="mt-4 flex items-center gap-3">
                  <span className="font-serif text-5xl">{rating.toFixed(1)}</span>
                  <span>
                    <Stars rating={rating} size={18} />
                    <span className="text-muted block text-sm">
                      {p.reviews.length} review{p.reviews.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {distribution.map((d) => (
                    <li key={d.n} className="flex items-center gap-2">
                      <span className="w-3">{d.n}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-dark">
                        <span className="block h-full rounded-full bg-wattle" style={{ width: `${(d.count / p.reviews.length) * 100}%` }} />
                      </span>
                      <span className="text-muted w-4 text-right">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted mt-4">No reviews yet — be the first to tell everyone what you think.</p>
            )}
            <div className="mt-6">
              <ReviewForm productId={p.id} />
            </div>
          </div>

          <ul className="divide-y divide-line">
            {p.reviews.map((r) => (
              <li key={r.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={r.rating} />
                  <time className="text-muted text-sm" dateTime={r.createdAt.toISOString()}>
                    {r.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                </div>
                <h3 className="mt-2 font-sans text-lg font-semibold">{r.title}</h3>
                <p className="mt-1 text-[#463f39]">{r.body}</p>
                <p className="text-muted mt-2 text-sm">
                  <span className="font-semibold text-ink">{r.name}</span>
                  {r.location && ` · ${r.location}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-12">
          <h2 className="mb-8 text-2xl sm:text-3xl">You might also love</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group px-5" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-5 text-[#463f39]">{children}</div>
    </details>
  );
}
