import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewForm } from "@/components/forms/ReviewForm";
import { DeliveryCheck } from "@/components/product/DeliveryCheck";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs, Stars } from "@/components/ui";
import { CATEGORIES, collectionBySlug, type Category } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { getProduct, relatedProducts } from "@/lib/products";
import { parseJson } from "@/lib/json";
import { store } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const from = Math.min(...p.variants.map((v) => v.priceCents));
  return {
    title: p.name,
    description: `${p.tagline} From ${formatPrice(from)}. Free delivery over ${formatPrice(store.commerce.freeShippingThresholdCents)}.`,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.tagline, images: p.images[0] ? [{ url: `${p.images[0].url}?w=1200&h=630&fit=crop` }] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const { colour } = await searchParams;
  const p = await getProduct(slug);
  if (!p) notFound();

  const related = await relatedProducts(p.id, p.collection, p.category);
  const collection = collectionBySlug(p.collection);
  const details = parseJson<string[]>(p.details, []);
  const specs = parseJson<{ label: string; value: string }[]>(p.specs, []);
  const rating = p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    material: p.material,
    brand: { "@type": "Brand", name: p.seller?.name ?? store.name },
    url: `${store.url}/products/${p.slug}`,
    // Uploaded photos are stored as site-relative paths; search engines need full URLs
    image: p.images.map((i) => (i.url.startsWith("/") ? `${store.url}${i.url}` : i.url)),
    ...(specs.length && {
      additionalProperty: specs.map((sp) => ({ "@type": "PropertyValue", name: sp.label, value: sp.value })),
    }),
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: `${p.name}, ${v.colourName}, ${v.size}`,
      price: (v.priceCents / 100).toFixed(2),
      priceCurrency: "AUD",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" } },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "AU",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: store.commerce.returnDays,
      },
    })),
    ...(rating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: p.reviews.length },
    }),
  };

  return (
    <div className="page-x pb-20 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: `/shop/${p.category}`, label: CATEGORIES[p.category as Category]?.name ?? "Shop" },
          ...(collection ? [{ href: `/shop/${collection.slug}`, label: collection.name }] : []),
          { label: p.name },
        ]}
      />

      <div className="mt-5">
        <ProductBuyBox
          initialColour={typeof colour === "string" ? colour : undefined}
          product={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            tagline: p.tagline,
            category: p.category,
            monogramable: p.monogramable,
            seller: p.seller
              ? {
                  id: p.seller.id,
                  name: p.seller.name,
                  slug: p.seller.slug,
                  gst: p.seller.gstRegistered,
                  dispatchDays: p.seller.dispatchDays,
                  shipsFrom: p.seller.shipFromSuburb && p.seller.shipFromState ? `${p.seller.shipFromSuburb} ${p.seller.shipFromState}` : null,
                }
              : null,
            rating,
            reviewCount: p.reviews.length,
            images: p.images.map((i) => ({ url: i.url, alt: i.alt, colourName: i.colourName })),
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
        >
          <div className="mt-8 border-t border-line">
            <Section title="Description" open>
              <p>{p.description}</p>
            </Section>
            {specs.length > 0 && (
              <Section title="Specifications">
                <table className="w-full text-left">
                  <tbody>
                    {specs.map((sp, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <th scope="row" className="w-2/5 py-2 pr-4 align-top font-normal text-ink">
                          {sp.label}
                        </th>
                        <td className="py-2 align-top">{sp.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}
            {(details.length > 0 || p.material || p.care) && (
              <Section title="Details and care">
                {details.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4">
                    {details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
                {p.material && (
                  <p className={details.length ? "mt-3" : ""}>
                    <span className="text-ink">Material:</span> {p.material}
                  </p>
                )}
                {p.care && <p className="mt-3">{p.care}</p>}
              </Section>
            )}
            <Section title="Delivery and returns">
              <p>
                Free standard delivery on orders over {formatPrice(store.commerce.freeShippingThresholdCents)}. Orders leave us
                within 1 to 2 business days. Unused items can be returned within {store.commerce.returnDays} days.{" "}
                <a href="/returns" className="link">
                  Returns policy
                </a>
              </p>
              <DeliveryCheck />
            </Section>
          </div>
        </ProductBuyBox>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-20 scroll-mt-28 border-t border-line pt-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-2xl">Reviews</h2>
            {rating !== null ? (
              <p className="mt-3 flex items-center gap-3 text-[14px]">
                <Stars rating={rating} size={14} />
                {rating.toFixed(1)} from {p.reviews.length} review{p.reviews.length === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="mt-3 text-grey">No reviews yet.</p>
            )}
            <div className="mt-6">
              <ReviewForm productId={p.id} />
            </div>
          </div>
          <ul className="divide-y divide-line border-t border-line lg:border-t-0">
            {p.reviews.map((r) => (
              <li key={r.id} className="py-6 lg:first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={r.rating} />
                  <time className="text-[13px] text-grey" dateTime={r.createdAt.toISOString()}>
                    {r.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <h3 className="mt-3 text-[15px] font-medium">{r.title}</h3>
                <p className="mt-1 text-[#3b3a38]">{r.body}</p>
                <p className="mt-2 text-[13px] text-grey">
                  {r.name}
                  {r.location && `, ${r.location}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-7 text-2xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function Section({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-lg leading-none transition group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="pb-5 text-[14px] text-grey">{children}</div>
    </details>
  );
}
