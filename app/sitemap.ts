import type { MetadataRoute } from "next";

import { CATEGORIES, COLLECTIONS } from "@/lib/collections";
import { prisma } from "@/lib/prisma";
import { visibleProduct } from "@/lib/products";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, makers] = await Promise.all([
    prisma.product.findMany({ where: visibleProduct, select: { slug: true, updatedAt: true } }),
    prisma.seller.findMany({ where: { status: "active", products: { some: visibleProduct } }, select: { slug: true, updatedAt: true } }),
  ]);
  const page = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({ url: `${store.url}${path}`, priority });

  return [
    page("/", 1),
    page("/shop", 0.9),
    ...Object.keys(CATEGORIES).map((c) => page(`/shop/${c}`, 0.9)),
    ...COLLECTIONS.map((c) => page(`/shop/${c.slug}`, 0.8)),
    ...products.map((p) => ({ url: `${store.url}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...(makers.length ? [page("/makers", 0.6)] : []),
    ...makers.map((m) => ({ url: `${store.url}/makers/${m.slug}`, lastModified: m.updatedAt, priority: 0.6 })),
    ...["/about", "/contact", "/faq", "/shipping", "/returns", "/care-guide", "/privacy", "/terms", "/sell", "/sell/terms"].map((p) => page(p, 0.4)),
  ];
}
