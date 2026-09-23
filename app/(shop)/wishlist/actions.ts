"use server";

import { productsBySlugs } from "@/lib/products";

export async function wishlistProducts(slugs: unknown) {
  if (!Array.isArray(slugs)) return [];
  const clean = slugs.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s)).slice(0, 100);
  return clean.length ? productsBySlugs(clean) : [];
}
