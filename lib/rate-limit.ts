import "server-only";

import { headers } from "next/headers";

/**
 * A small in-memory limiter for public forms (contact, reviews, newsletter).
 * Good enough for a single Node process; use Redis if you scale out.
 */
const hits = new Map<string, number[]>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimited(bucket: string, limit: number, windowMs: number) {
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k);
  }
  return recent.length > limit;
}

/** Same as rateLimited, but keyed on something other than the IP (e.g. an email address being logged into). */
export function rateLimitedKey(bucket: string, key: string, limit: number, windowMs: number) {
  const k = `${bucket}:key:${key}`;
  const now = Date.now();
  const recent = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(k, recent);
  return recent.length > limit;
}
