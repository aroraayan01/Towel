/**
 * Pure pricing maths shared by the cart (client) and checkout (server).
 * The server always re-runs this against database prices — the client's copy
 * is only for showing numbers as people shop.
 */
import { gstIncluded } from "./money";
import { shippingQuote, type ShippingMethod, type StateCode } from "./shipping";
import { store } from "./store";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  image: string;
  unitCents: number;
  quantity: number;
  monogram?: string;
};

export const MAX_QTY = 20;
export const MONOGRAM_MAX = 3;

export function lineKey(l: Pick<CartLine, "variantId" | "monogram">) {
  return `${l.variantId}::${l.monogram ?? ""}`;
}

export function lineUnitCents(l: Pick<CartLine, "unitCents" | "monogram">) {
  return l.unitCents + (l.monogram ? store.commerce.monogramCents : 0);
}

export function lineTotalCents(l: Pick<CartLine, "unitCents" | "monogram" | "quantity">) {
  return lineUnitCents(l) * l.quantity;
}

export function totals(opts: {
  lines: Pick<CartLine, "unitCents" | "monogram" | "quantity">[];
  state?: StateCode | null;
  method?: ShippingMethod;
  percentOff?: number;
  giftWrap?: boolean;
}) {
  const subtotal = opts.lines.reduce((s, l) => s + lineTotalCents(l), 0);
  const discount = opts.percentOff ? Math.round((subtotal * opts.percentOff) / 100) : 0;
  const giftWrap = opts.giftWrap ? store.commerce.giftWrapCents : 0;
  // Free-shipping threshold is judged on what they're actually paying for goods
  const shipping = shippingQuote(opts.method ?? "standard", opts.state ?? null, subtotal - discount);
  const total = subtotal - discount + giftWrap + shipping.cents;
  return {
    subtotal,
    discount,
    giftWrap,
    shipping,
    total,
    gst: gstIncluded(total),
    toFreeShipping: Math.max(0, store.commerce.freeShippingThresholdCents - (subtotal - discount)),
  };
}

/** Monograms are up to three letters, A–Z only (it's what the embroiderer can do). */
export function cleanMonogram(input: string | undefined | null) {
  const m = (input ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, MONOGRAM_MAX);
  return m || undefined;
}
