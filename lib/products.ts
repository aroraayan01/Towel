import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { PLACEHOLDER } from "./placeholder";
import { prisma } from "./prisma";

/**
 * What customers can see: switched on, approved, and (for marketplace
 * products) from a seller whose account is active. Every shop query uses this.
 */
export const visibleProduct = {
  active: true,
  reviewStatus: "approved",
  OR: [{ sellerId: null }, { seller: { status: "active" } }],
} satisfies Prisma.ProductWhereInput;

/** The same rule for a product already loaded with its seller (checkout uses this). */
export const isVisible = (p: { active: boolean; reviewStatus: string; seller?: { status: string } | null }) =>
  p.active && p.reviewStatus === "approved" && (!p.seller || p.seller.status === "active");

const approvedImages = { where: { approved: true }, orderBy: { sortOrder: "asc" as const } };

const listInclude = {
  variants: { where: { archived: false }, orderBy: [{ sortOrder: "asc" as const }, { priceCents: "asc" as const }] },
  images: approvedImages,
  reviews: { where: { approved: true }, select: { rating: true } },
  seller: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type ProductForList = Prisma.ProductGetPayload<{ include: typeof listInclude }>;

export type ProductSummary = ReturnType<typeof summarise>;

/** The shape product cards need. Serialisable, no Dates. */
export function summarise(p: ProductForList) {
  const prices = p.variants.map((v) => v.priceCents);
  const compare = p.variants.map((v) => v.compareAtCents ?? 0).filter((c) => c > 0);

  const colours: { name: string; hex: string; accent: string; image: string | null }[] = [];
  for (const v of p.variants) {
    if (colours.some((c) => c.name === v.colourName)) continue;
    colours.push({
      name: v.colourName,
      hex: v.colourHex,
      accent: v.accentHex,
      image: p.images.find((i) => i.colourName === v.colourName)?.url ?? null,
    });
  }

  // Card shows the first colour's first photo; hover shows its next photo, or a shared lifestyle shot
  const first = colours[0]?.name;
  const firstSet = p.images.filter((i) => i.colourName === first);
  const shared = p.images.filter((i) => !i.colourName);
  const primary = firstSet[0] ?? shared[0] ?? p.images[0];
  const secondary = firstSet[1] ?? shared[0] ?? p.images.find((i) => i !== primary);

  const ratings = p.reviews.map((r) => r.rating);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    category: p.category,
    collection: p.collection,
    isNew: p.isNew,
    bestseller: p.bestseller,
    image: primary?.url ?? PLACEHOLDER,
    imageAlt: primary?.alt ?? p.name,
    hoverImage: secondary && secondary.url !== primary?.url ? secondary.url : null,
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
    compareAtCents: compare.length ? Math.max(...compare) : null,
    colours,
    inStock: p.variants.some((v) => v.stock > 0),
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
    /** The marketplace seller, or null for xomexo's own products */
    maker: p.seller ? { name: p.seller.name, slug: p.seller.slug } : null,
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
  /** Only this marketplace seller's products (their maker page) */
  sellerId?: string;
};

export async function listProducts(filter: ProductFilter = {}) {
  const and: Prisma.ProductWhereInput[] = [visibleProduct];
  if (filter.category) and.push({ category: filter.category });
  if (filter.collection) and.push({ collection: filter.collection });
  if (filter.sellerId) and.push({ sellerId: filter.sellerId });
  if (filter.q) {
    const q = filter.q.trim();
    and.push({ OR: [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { material: { contains: q } },
      { variants: { some: { archived: false, colourName: { contains: q } } } },
      { seller: { name: { contains: q } } },
    ] });
  }

  const rows = await prisma.product.findMany({
    where: { AND: and },
    include: listInclude,
    orderBy: [{ featured: "desc" }, { bestseller: "desc" }, { createdAt: "asc" }],
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
    where: { slug, ...visibleProduct },
    include: {
      variants: { where: { archived: false }, orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }] },
      images: approvedImages,
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
      seller: {
        select: { id: true, name: true, slug: true, gstRegistered: true, dispatchDays: true, shipFromSuburb: true, shipFromState: true, abn: true, legalName: true },
      },
    },
  });
}

export async function relatedProducts(productId: string, collection: string, category: string) {
  const rows = await prisma.product.findMany({
    where: { ...visibleProduct, id: { not: productId }, category },
    include: listInclude,
    take: 8,
  });
  return rows
    .map(summarise)
    .sort((a, b) => Number(b.collection === collection) - Number(a.collection === collection))
    .slice(0, 4);
}

export async function productsBySlugs(slugs: string[]) {
  const rows = await prisma.product.findMany({ where: { ...visibleProduct, slug: { in: slugs } }, include: listInclude });
  return rows.map(summarise);
}

export async function allColours(category?: string) {
  return prisma.variant.findMany({
    where: { archived: false, product: { ...visibleProduct, ...(category ? { category } : {}) } },
    select: { colourName: true, colourHex: true },
    distinct: ["colourName"],
    orderBy: { colourName: "asc" },
  });
}
