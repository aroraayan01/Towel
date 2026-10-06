/**
 * Shipment statuses and carriers. Client-safe: used by the seller portal,
 * admin and the customer's order page.
 */
export const SHIPMENT_STATUSES = ["PENDING", "TO_SHIP", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  PENDING: "Awaiting payment",
  TO_SHIP: "To ship",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** What a sender can move a paid shipment to. */
export const FULFILMENT_STEPS: ShipmentStatus[] = ["TO_SHIP", "PACKED", "SHIPPED", "DELIVERED"];

export const isShipmentStatus = (s: string): s is ShipmentStatus => (SHIPMENT_STATUSES as readonly string[]).includes(s);

export const CARRIERS = ["Australia Post", "StarTrack", "Sendle", "CouriersPlease", "Aramex", "DHL", "Other"] as const;

const TRACK: Record<string, (n: string) => string> = {
  "Australia Post": (n) => `https://auspost.com.au/mypost/track/details/${n}`,
  StarTrack: (n) => `https://startrack.com.au/track/details/${n}`,
  Sendle: (n) => `https://track.sendle.com/tracking?ref=${n}`,
  CouriersPlease: (n) => `https://www.couriersplease.com.au/tools-track/no/${n}`,
  Aramex: (n) => `https://www.aramex.com.au/tools/track?l=${n}`,
  DHL: (n) => `https://www.dhl.com/au-en/home/tracking/tracking-express.html?tracking-id=${n}`,
};

/** A link to the carrier's tracking page, when we know the carrier. */
export function trackingUrl(carrier: string | null | undefined, number: string | null | undefined) {
  if (!number) return null;
  const make = TRACK[carrier ?? "Australia Post"];
  return make ? make(encodeURIComponent(number)) : null;
}
