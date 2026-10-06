import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { formatMoney } from "./money";
import { prisma } from "./prisma";
import type { ShipmentStatus } from "./shipments";
import { store } from "./store";

/**
 * Marketplace money and shipment rules.
 *
 * - When an order is paid, each seller's shipment earns them its goods at full
 *   price plus the delivery charged for it (a SALE entry), minus commission on
 *   the goods (a COMMISSION entry). Discount codes are funded by the shop, so
 *   they never reduce what a seller earns.
 * - Those entries can't be paid out until the seller ships, plus a hold
 *   period for returns (store.marketplace.payoutHoldDays).
 * - Cancelling or refunding reverses whatever a shipment earned, once.
 * - The seller's balance is the sum of their ledger.
 */

/** Far enough in the future to mean "not until the seller ships". */
const LOCKED = new Date("9999-12-31T00:00:00Z");

export const commissionFor = (goodsCents: number, bps: number) => Math.round((goodsCents * bps) / 10000);

export const percent = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`;

type Tx = Prisma.TransactionClient;

/** Called once when an order is paid. Records each seller's earnings, locked until they ship. */
export async function recordSales(tx: Tx, orderId: string) {
  const shipments = await tx.shipment.findMany({
    where: { orderId, sellerId: { not: null } },
    include: { order: { select: { number: true } }, seller: { select: { commissionBps: true } }, items: true },
  });
  for (const s of shipments) {
    if (!s.sellerId || !s.seller) continue;
    const goods = s.items.reduce((n, i) => n + (i.unitCents + i.monogramCents) * i.quantity, 0);
    const count = s.items.reduce((n, i) => n + i.quantity, 0);
    const commission = commissionFor(goods, s.seller.commissionBps);
    const base = { sellerId: s.sellerId, orderId, shipmentId: s.id, availableAt: LOCKED };
    await tx.ledgerEntry.createMany({
      data: [
        {
          ...base,
          type: "SALE",
          amountCents: goods + s.shippingCents,
          description: `Order #${s.order.number}: ${count} item${count === 1 ? "" : "s"} ${formatMoney(goods)}${s.shippingCents ? ` + delivery ${formatMoney(s.shippingCents)}` : ""}`,
        },
        {
          ...base,
          type: "COMMISSION",
          amountCents: -commission,
          description: `Commission ${percent(s.seller.commissionBps)} on ${formatMoney(goods)} (order #${s.order.number})`,
        },
      ],
    });
  }
}

/** When a seller ships, their earnings for that shipment unlock after the hold period. */
export async function releaseOnShip(tx: Tx, shipmentId: string, shippedAt: Date) {
  const availableAt = new Date(shippedAt.getTime() + store.marketplace.payoutHoldDays * 86400_000);
  await tx.ledgerEntry.updateMany({
    where: { shipmentId, type: { in: ["SALE", "COMMISSION"] }, availableAt: LOCKED },
    data: { availableAt },
  });
}

/** Reverses what a shipment earned (cancelled or refunded). Safe to call twice. */
export async function reverseShipment(tx: Tx, shipmentId: string, why: string) {
  const entries = await tx.ledgerEntry.findMany({ where: { shipmentId } });
  if (!entries.length || entries.some((e) => e.type === "REFUND")) return;
  const sale = entries.filter((e) => e.type === "SALE").reduce((n, e) => n + e.amountCents, 0);
  const commission = entries.filter((e) => e.type === "COMMISSION").reduce((n, e) => n + e.amountCents, 0);
  const { sellerId, orderId } = entries[0];
  const now = new Date();
  await tx.ledgerEntry.createMany({
    data: [
      { sellerId, orderId, shipmentId, type: "REFUND", amountCents: -sale, description: why, availableAt: now },
      { sellerId, orderId, shipmentId, type: "COMMISSION_REFUND", amountCents: -commission, description: `Commission returned: ${why}`, availableAt: now },
    ],
  });
}

/** The order's overall status, worked out from its shipments. */
export function orderStatusFrom(current: string, shipments: { status: string }[]) {
  if (current === "PENDING" || current === "CANCELLED" || current === "REFUNDED") return current;
  const live = shipments.filter((s) => s.status !== "CANCELLED").map((s) => s.status as ShipmentStatus);
  if (!live.length) return "CANCELLED";
  if (live.every((s) => s === "DELIVERED")) return "DELIVERED";
  if (live.every((s) => s === "SHIPPED" || s === "DELIVERED")) return "SHIPPED";
  if (live.some((s) => s === "SHIPPED" || s === "DELIVERED")) return "PARTLY_SHIPPED";
  if (live.every((s) => s === "PACKED")) return "PACKED";
  return "PAID";
}

export async function syncOrderStatus(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { shipments: { select: { status: true } } } });
  const next = orderStatusFrom(order.status, order.shipments);
  if (next !== order.status) await tx.order.update({ where: { id: orderId }, data: { status: next } });
  return next;
}

/** Balance, payable now, and still on hold, for one seller or all of them. */
export async function balances(sellerId?: string) {
  const now = new Date();
  const where = sellerId ? { sellerId } : {};
  const [all, available] = await Promise.all([
    prisma.ledgerEntry.groupBy({ by: ["sellerId"], where, _sum: { amountCents: true } }),
    prisma.ledgerEntry.groupBy({ by: ["sellerId"], where: { ...where, availableAt: { lte: now } }, _sum: { amountCents: true } }),
  ]);
  const map = new Map<string, { balance: number; available: number; onHold: number }>();
  for (const r of all) map.set(r.sellerId, { balance: r._sum.amountCents ?? 0, available: 0, onHold: 0 });
  for (const r of available) {
    const m = map.get(r.sellerId) ?? { balance: 0, available: 0, onHold: 0 };
    m.available = Math.max(0, Math.min(m.balance, r._sum.amountCents ?? 0));
    map.set(r.sellerId, m);
  }
  for (const m of map.values()) m.onHold = Math.max(0, m.balance - m.available);
  return map;
}

export async function balanceFor(sellerId: string) {
  return (await balances(sellerId)).get(sellerId) ?? { balance: 0, available: 0, onHold: 0 };
}

/** URL-safe slug for a seller's maker page, unique among sellers. */
export async function uniqueSellerSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "maker";
  for (let i = 0; ; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    if (!(await prisma.seller.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

/** Australian Business Number check (ATO weighting). Accepts spaces. */
export function validAbn(input: string) {
  const digits = input.replace(/\s/g, "");
  if (!/^\d{11}$/.test(digits)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const sum = digits.split("").reduce((s, d, i) => s + (Number(d) - (i === 0 ? 1 : 0)) * weights[i], 0);
  return sum % 89 === 0;
}

export const formatAbn = (abn: string) => abn.replace(/\s/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");

/** Seller products waiting on staff: new ones, changes to live ones, and new photos. */
export const approvalQueue = {
  sellerId: { not: null },
  OR: [{ reviewStatus: "pending" }, { pendingChanges: { not: null } }, { reviewStatus: "approved", images: { some: { approved: false } } }],
} satisfies Prisma.ProductWhereInput;
