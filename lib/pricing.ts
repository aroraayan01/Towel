/**
 * Pure pricing maths shared by the cart (client) and checkout (server).
 * The server always re-runs this against database prices — the client's copy
 * is only for showing numbers as people shop.
 *
 * A cart can hold xomexo's own products and products from marketplace
 * sellers. Each sender ships separately, so the cart splits into shipment
 * groups: delivery is quoted per group (the free-delivery threshold applies
 * to each), and GST only applies to suppliers registered for it.
 */
import { gstIncluded } from "./money";
import { shippingQuote, type ShippingMethod, type StateCode } from "./shipping";
import { store } from "./store";

/** Who sells and ships a product. Absent or null means xomexo itself. */
export type CartSeller = { id: string; name: string; gst: boolean };

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
  seller?: CartSeller | null;
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

type PricedLine = Pick<CartLine, "unitCents" | "monogram" | "quantity" | "seller">;

export const HOUSE = "house";

/** The discount on one line. Rounded per line so cart, checkout and invoice agree to the cent. */
export const lineDiscountCents = (l: Pick<CartLine, "unitCents" | "monogram" | "quantity">, percentOff = 0) =>
  percentOff ? Math.round((lineTotalCents(l) * percentOff) / 100) : 0;

/** GST included in an amount from a supplier: none if they aren't registered. */
export const supplierGst = (cents: number, registered: boolean) => (registered ? gstIncluded(cents) : 0);

export function totals<L extends PricedLine>(opts: {
  lines: L[];
  state?: StateCode | null;
  method?: ShippingMethod;
  percentOff?: number;
  giftWrap?: boolean;
}) {
  const method = opts.method ?? "standard";
  const pct = opts.percentOff ?? 0;

  // House first, then sellers in the order they appear in the cart
  const order: string[] = [];
  const byKey = new Map<string, L[]>();
  for (const l of opts.lines) {
    const key = l.seller?.id ?? HOUSE;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)!.push(l);
  }
  order.sort((a, b) => Number(b === HOUSE) - Number(a === HOUSE));

  const groups = order.map((key) => {
    const lines = byKey.get(key)!;
    const seller = lines[0].seller ?? null;
    const registered = seller ? seller.gst : store.gstRegistered;
    const subtotal = lines.reduce((s, l) => s + lineTotalCents(l), 0);
    const discount = lines.reduce((s, l) => s + lineDiscountCents(l, pct), 0);
    // Free-delivery threshold is judged on what they're actually paying for goods
    const shipping = shippingQuote(method, opts.state ?? null, subtotal - discount);
    const goodsGst = lines.reduce((s, l) => s + supplierGst(lineTotalCents(l) - lineDiscountCents(l, pct), registered), 0);
    return {
      key,
      sellerId: seller?.id ?? null,
      name: seller?.name ?? store.name,
      gstRegistered: registered,
      lines,
      subtotal,
      discount,
      shipping,
      gst: goodsGst + supplierGst(shipping.cents, registered),
      toFreeShipping: Math.max(0, store.commerce.freeShippingThresholdCents - (subtotal - discount)),
    };
  });

  const subtotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const discount = groups.reduce((s, g) => s + g.discount, 0);
  // Gift wrap is done by us, so it's only offered when we ship everything
  const giftWrapAllowed = groups.every((g) => g.sellerId === null);
  const giftWrap = opts.giftWrap && giftWrapAllowed ? store.commerce.giftWrapCents : 0;
  const shippingCents = groups.reduce((s, g) => s + g.shipping.cents, 0);
  const total = subtotal - discount + giftWrap + shippingCents;
  const single = groups.length <= 1 ? (groups[0]?.shipping ?? shippingQuote(method, opts.state ?? null, 0)) : null;

  return {
    groups,
    subtotal,
    discount,
    giftWrap,
    giftWrapAllowed,
    /** Combined delivery, shaped like a single quote for simple displays */
    shipping: {
      method,
      label: groups.length > 1 ? `Delivery (${groups.length} shipments)` : (single?.label ?? "Delivery"),
      cents: shippingCents,
      eta: single?.eta ?? groups[0]?.shipping.eta ?? "",
      free: groups.length > 0 && groups.every((g) => g.shipping.free),
    },
    total,
    gst: groups.reduce((s, g) => s + g.gst, 0) + supplierGst(giftWrap, store.gstRegistered),
    /** For a single shipment: how far from free delivery. With several, see groups[].toFreeShipping. */
    toFreeShipping: groups.length === 1 ? groups[0].toFreeShipping : Math.max(0, store.commerce.freeShippingThresholdCents - (subtotal - discount)),
  };
}

export type Totals = ReturnType<typeof totals>;

/** Monograms are up to three letters, A–Z only (it's what the embroiderer can do). */
export function cleanMonogram(input: string | undefined | null) {
  const m = (input ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, MONOGRAM_MAX);
  return m || undefined;
}
