import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";

import { sendShipmentEmail } from "./email";
import { releaseOnShip, reverseShipment, syncOrderStatus } from "./marketplace";
import { prisma } from "./prisma";
import { isShipmentStatus, SHIPMENT_LABEL, trackingUrl, type ShipmentStatus } from "./shipments";
import { store } from "./store";

/** A parcel that never left goes back on the shelf: its items return to stock. */
async function restock(tx: Prisma.TransactionClient, shipmentId: string) {
  const items = await tx.orderItem.findMany({ where: { shipmentId } });
  for (const i of items) await tx.variant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
}

export type ShipmentPatch = {
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  notify?: boolean;
};

/**
 * Updates one shipment for whoever ships it (admin for xomexo's own parcels,
 * or the seller). Unlocks the seller's earnings when it ships, reverses them
 * if it's cancelled, emails the customer, and keeps the order status in step.
 * Returns a short description of what changed, for the activity log.
 */
export async function updateShipment(shipmentId: string, patch: ShipmentPatch, opts: { allowCancel: boolean }) {
  if (!isShipmentStatus(patch.status) || patch.status === "PENDING") throw new Error("Bad status");
  const status = patch.status as ShipmentStatus;

  const before = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { order: { include: { shipments: { select: { id: true } } } }, seller: { select: { name: true } }, items: true },
  });
  if (before.status === "PENDING") throw new Error("This order hasn't been paid yet.");
  if (before.status === "CANCELLED" && status !== "CANCELLED") throw new Error("This shipment was cancelled.");
  if (status === "CANCELLED" && !opts.allowCancel) throw new Error("Only the shop can cancel a shipment. Contact us.");

  const carrier = patch.carrier?.trim() || null;
  const trackingNumber = patch.trackingNumber?.trim().replace(/\s+/g, "") || null;
  const nowShipped = (status === "SHIPPED" || status === "DELIVERED") && !before.shippedAt;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status,
        carrier,
        trackingNumber,
        ...(nowShipped ? { shippedAt: now } : {}),
        ...(status === "DELIVERED" && !before.deliveredAt ? { deliveredAt: now } : {}),
      },
    });
    if (status === "CANCELLED" && before.status !== "CANCELLED" && !before.shippedAt) await restock(tx, shipmentId);
    if (before.sellerId) {
      if (nowShipped) await releaseOnShip(tx, shipmentId, now);
      if (status === "CANCELLED" && before.status !== "CANCELLED") await reverseShipment(tx, shipmentId, `Order #${before.order.number} cancelled`);
    }
    await syncOrderStatus(tx, before.orderId);
  });

  if (status === "SHIPPED" && before.status !== "SHIPPED" && patch.notify) {
    await sendShipmentEmail(before.order, {
      carrier,
      trackingNumber,
      trackUrl: trackingUrl(carrier, trackingNumber),
      senderName: before.seller?.name ?? store.name,
      items: before.items.map((i) => `${i.quantity} × ${i.name} (${i.variantLabel})`),
      partOfMany: before.order.shipments.length > 1,
    });
  }

  return [
    before.status !== status && `${SHIPMENT_LABEL[before.status as ShipmentStatus] ?? before.status} → ${SHIPMENT_LABEL[status]}`,
    (before.trackingNumber ?? null) !== trackingNumber && (trackingNumber ? `tracking ${carrier ? `${carrier} ` : ""}${trackingNumber}` : "tracking removed"),
    status === "SHIPPED" && before.status !== "SHIPPED" && patch.notify && "customer emailed",
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Cancels or refunds a whole order: every shipment that hasn't gone out is
 * cancelled, and every seller's earnings on it are reversed. (Refund the
 * customer's money in Stripe; this only records it.)
 */
export async function closeOrder(orderId: string, status: "CANCELLED" | "REFUNDED") {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { shipments: true } });
    for (const s of order.shipments) {
      // Unsent parcels are cancelled and their stock returned (only if the order was paid, so stock was taken)
      if (s.status !== "SHIPPED" && s.status !== "DELIVERED" && s.status !== "CANCELLED") {
        await tx.shipment.update({ where: { id: s.id }, data: { status: "CANCELLED" } });
        if (s.status !== "PENDING") await restock(tx, s.id);
      }
      if (s.sellerId) await reverseShipment(tx, s.id, `Order #${order.number} ${status === "REFUNDED" ? "refunded" : "cancelled"}`);
    }
    await tx.order.update({ where: { id: orderId }, data: { status } });
  });
}
