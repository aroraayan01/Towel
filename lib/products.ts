import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";

const withVariants = {
  variants: { orderBy: [{ sortOrder: "asc" as const }, { priceCents: "asc" as const }] },
  reviews: { where: { approved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithVariants = Prisma.ProductGetPayload<{ include: typeof withVariants }>;

export type ProductSummary = ReturnType<typeof summarise>;

/** The shape product cards and listings need — serialisable, no Dates. */
export function summarise(p: ProductWithVariants) {
  const prices = p.variants.map((v) => v.priceCents);
  const compare = p.variants
    .map((v) => v.compareAtCents ?? 0)
    .filter((c) => c > 0);
  const colours: { name: string; hex: string; accent: string }[] = [];
  for (const v of p.variants) {
    if (!colours.some((c) => c.name === v.colourName)) {
      colours.push({ name: v.colourName, hex: v.colourHex, accent: v.accentHex });
    }
  }
  const ratings = p.reviews.map((r) => r.rating);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    category: p.category,
    collection: p.collection,
    pattern: p.pattern,
    imageUrl: p.imageUrl,
    isNew: p.isNew,
    bestseller: p.bestseller,
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
    compareAtCents: compare.length ? Math.max(...compare) : null,
    colours,
    inStock: p.variants.some((v) => v.stock > 0),
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
  };
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

export type ProductFilter = {
  category?: string;
  collection?: string;
  colour?: string;
  q?: string;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
};

export async function listProducts(filter: ProductFilter = {}) {
  const where: Prisma.ProductWhereInput = { active: true };
  if (filter.category) where.category = filter.category;
  if (filter.collection) where.collection = filter.collection;
  if (filter.q) {
    const q = filter.q.trim();
    where.OR = [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { material: { contains: q } },
      { variants: { some: { colourName: { contains: q } } } },
    ];
  }

  const rows = await prisma.product.findMany({
    where,
    include: withVariants,
    orderBy: [{ featured: "desc" }, { bestseller: "desc" }, { createdAt: "desc" }],
  });

  let items = rows.map(summarise);
  if (filter.colour) {
    const c = filter.colour.toLowerCase();
    items = items.filter((p) => p.colours.some((x) => x.name.toLowerCase() === c));
  }
  if (filter.maxPrice) items = items.filter((p) => p.minPriceCents <= filter.maxPrice!);
  if (filter.inStock) items = items.filter((p) => p.inStock);

  switch (filter.sort) {
    case "price-asc":
      items.sort((a, b) => a.minPriceCents - b.minPriceCents);
      break;
    case "price-desc":
      items.sort((a, b) => b.minPriceCents - a.minPriceCents);
      break;
    case "newest":
      items.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      break;
    case "rating":
      items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
  }
  return items;
}

export async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      variants: { orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }] },
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function relatedProducts(productId: string, collection: string, category: string) {
  const rows = await prisma.product.findMany({
    where: { active: true, id: { not: productId }, category },
    include: withVariants,
    take: 8,
  });
  // Same collection first, then the rest of the category
  return rows
    .map(summarise)
    .sort((a, b) => Number(b.collection === collection) - Number(a.collection === collection))
    .slice(0, 4);
}

export async function productsBySlugs(slugs: string[]) {
  const rows = await prisma.product.findMany({
    where: { active: true, slug: { in: slugs } },
    include: withVariants,
  });
  return rows.map(summarise);
}

export async function allColours(category?: string) {
  const rows = await prisma.variant.findMany({
    where: { product: { active: true, ...(category ? { category } : {}) } },
    select: { colourName: true, colourHex: true },
    distinct: ["colourName"],
    orderBy: { colourName: "asc" },
  });
  return rows;
}
