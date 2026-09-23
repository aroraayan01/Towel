import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShopListing } from "@/components/product/ShopListing";
import { CATEGORIES, collectionBySlug, isCategory } from "@/lib/collections";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const info = isCategory(slug) ? CATEGORIES[slug] : collectionBySlug(slug);
  if (!info) return {};
  return {
    title: info.name,
    description: info.blurb,
    alternates: { canonical: `/shop/${slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  if (isCategory(slug)) {
    const c = CATEGORIES[slug];
    return <ShopListing title={c.name} intro={c.blurb} eyebrow="Shop" category={slug} searchParams={sp} basePath={`/shop/${slug}`} />;
  }
  const col = collectionBySlug(slug);
  if (!col) notFound();
  return (
    <ShopListing
      title={col.name}
      intro={col.blurb}
      eyebrow={CATEGORIES[col.category].name}
      category={col.category}
      collection={col.slug}
      searchParams={sp}
      basePath={`/shop/${slug}`}
    />
  );
}
