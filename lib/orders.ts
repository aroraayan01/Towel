import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { sendOrderConfirmation } from "./email";
import { prisma } from "./prisma";

export const ORDER_STATUSES = ["PENDING", "PAID", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Order received",
  PACKED: "Packed",
  SHIPPED: "On its way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function newAccessToken() {
  return randomBytes(18).toString("base64url");
}

export function tokenMatches(expected: string, given: string | undefined | null) {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Sequential order numbers starting at 1001, shown to customers as #1001 */
export async function nextOrderNumber() {
  const last = await prisma.order.findFirst({ orderBy: { createdAt: "desc" }, select: { number: true } });
  const n = last ? Number(last.number.replace(/\D/g, "")) : 1000;
  return String((Number.isFinite(n) ? n : 1000) + 1);
}

/**
 * Moves an order from PENDING to PAID exactly once, decrements stock and sends
 * the confirmation email. Safe to call from both the Stripe webhook and the
 * success page — whichever arrives first wins, the other is a no-op.
 */
export async function markOrderPaid(orderId: string) {
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (claimed.count === 0) return false;

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  await prisma.$transaction(
    order.items.map((i) =>
      prisma.variant.update({ where: { id: i.variantId }, data: { stock: { decrement: i.quantity } } })
    )
  );
  if (order.marketingOptIn) {
    await prisma.subscriber.upsert({ where: { email: order.email }, create: { email: order.email }, update: {} });
  }
  await sendOrderConfirmation(order);
  return true;
}
