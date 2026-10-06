import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import type { Prisma } from "@/app/generated/prisma/client";
import { sendOrderConfirmation, sendSellerNewOrder } from "./email";
import { recordSales } from "./marketplace";
import { prisma } from "./prisma";

export const ORDER_STATUSES = ["PENDING", "PAID", "PACKED", "PARTLY_SHIPPED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Order received",
  PACKED: "Packed",
  PARTLY_SHIPPED: "Partly shipped",
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

/** Everything the confirmation email and order pages need, including who ships each part. */
export const orderWithShipments = {
  items: true,
  shipments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      seller: { select: { id: true, name: true, slug: true, legalName: true, abn: true, gstRegistered: true, email: true, dispatchDays: true, users: { where: { active: true }, select: { email: true } } } },
    },
  },
} satisfies Prisma.OrderInclude;

/**
 * Moves an order from PENDING to PAID exactly once: takes the stock, marks
 * each shipment ready to ship, records what each marketplace seller earned,
 * and sends the confirmation and seller emails. Safe to call from both the
 * Stripe webhook and the success page: whichever arrives first wins.
 */
export async function markOrderPaid(orderId: string) {
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (claimed.count === 0) return false;

  await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const i of items) await tx.variant.update({ where: { id: i.variantId }, data: { stock: { decrement: i.quantity } } });
    await tx.shipment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "TO_SHIP" } });
    await recordSales(tx, orderId);
  });

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderWithShipments });
  if (order.marketingOptIn) {
    await prisma.subscriber.upsert({ where: { email: order.email }, create: { email: order.email }, update: {} });
  }
  await sendOrderConfirmation(order);

  // Each seller hears about their part only: items, address and gift note, nothing else
  const shipTo = [`${order.firstName} ${order.lastName}`, order.address1, order.address2, `${order.suburb} ${order.state} ${order.postcode}`, order.phone ? `Phone ${order.phone}` : null]
    .filter(Boolean)
    .join("\n");
  for (const s of order.shipments) {
    if (!s.seller) continue;
    const items = order.items
      .filter((i) => i.shipmentId === s.id)
      .map((i) => `${i.quantity} × ${i.name} (${i.variantLabel})${i.monogram ? `, initials ${i.monogram}` : ""}`);
    const recipients = new Set([s.seller.email, ...s.seller.users.map((u) => u.email)]);
    for (const to of recipients) {
      await sendSellerNewOrder(to, {
        sellerName: s.seller.name,
        orderNumber: order.number,
        shipmentId: s.id,
        items,
        shipTo,
        giftMessage: order.giftMessage,
        dispatchDays: s.seller.dispatchDays,
      });
    }
  }
  return true;
}
