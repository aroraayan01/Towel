import "server-only";

import { prisma } from "./prisma";

/** Validates a discount code for this shopper and cart. Not a server action — callers rate-limit. */
export async function checkDiscount(code: string, forEmail: string, subtotalCents: number) {
  const c = await prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return { ok: false as const, message: "That code isn't valid." };
  if (subtotalCents < c.minSpendCents) {
    return { ok: false as const, message: `This code needs a minimum spend of $${(c.minSpendCents / 100).toFixed(0)}.` };
  }
  if (c.oncePerEmail && forEmail) {
    const used = await prisma.order.count({
      where: { discountCode: c.code, email: forEmail.trim().toLowerCase(), status: { notIn: ["PENDING", "CANCELLED"] } },
    });
    if (used) return { ok: false as const, message: "Looks like you've already used this code." };
  }
  return { ok: true as const, code: c.code, percentOff: c.percentOff };
}
