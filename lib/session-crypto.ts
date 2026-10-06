import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** Signing for login cookies (staff and sellers), keyed on ADMIN_SECRET. */
function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SECRET must be set to a random string of 32+ characters");
  return s;
}

export const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
