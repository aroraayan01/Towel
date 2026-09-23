import type { MetadataRoute } from "next";

import { CATEGORIES, COLLECTIONS } from "@/lib/collections";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
  const page = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({ url: `${store.url}${path}`, priority });

  return [
    page("/", 1),
    page("/shop", 0.9),
    ...Object.keys(CATEGORIES).map((c) => page(`/shop/${c}`, 0.9)),
    ...COLLECTIONS.map((c) => page(`/shop/${c.slug}`, 0.8)),
    ...products.map((p) => ({ url: `${store.url}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...["/about", "/contact", "/faq", "/shipping", "/returns", "/care-guide", "/privacy", "/terms"].map((p) => page(p, 0.4)),
  ];
}
