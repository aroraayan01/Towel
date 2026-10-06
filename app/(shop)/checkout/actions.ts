"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/app/generated/prisma/client";
import { checkDiscount } from "@/lib/discounts";
import { markOrderPaid, newAccessToken, nextOrderNumber } from "@/lib/orders";
import { cleanMonogram, lineDiscountCents, MAX_QTY, supplierGst, totals, type CartSeller } from "@/lib/pricing";
import { isVisible } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { STATES, stateForPostcode, type StateCode } from "@/lib/shipping";
import { checkoutOpen, getStripe } from "@/lib/stripe";
import { store } from "@/lib/store";

export type CheckoutState = { error: string; fields?: Record<string, string> } | null;

const stateCodes = STATES.map((s) => s.code) as [string, ...string[]];

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9 +()-]*$/, "Numbers only")
    .optional(),
  address1: z.string().trim().min(3, "Required").max(120),
  address2: z.string().trim().max(120).optional(),
  suburb: z.string().trim().min(2, "Required").max(60),
  state: z.enum(stateCodes, { message: "Choose a state" }),
  postcode: z.string().trim().regex(/^\d{4}$/, "4-digit postcode"),
  method: z.enum(["standard", "express"]),
  giftMessage: z.string().trim().max(250).optional(),
  giftWrap: z.boolean(),
  marketingOptIn: z.boolean(),
  discountCode: z.string().trim().max(30).optional(),
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(MAX_QTY),
        monogram: z.string().optional(),
      })
    )
    .min(1, "Your cart is empty")
    .max(50),
});

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (!checkoutOpen()) return { error: "Online checkout isn't open yet. Please check back soon." };

  if (await rateLimited("checkout", 10, 10 * 60_000)) {
    return { error: "Too many checkout attempts. Please wait a few minutes and try again." };
  }

  let lines: unknown;
  try {
    lines = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {
    return { error: "We couldn't read your cart. Please refresh and try again." };
  }

  const opt = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };
  const parsed = schema.safeParse({
    email: form.get("email"),
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    phone: opt("phone"),
    address1: form.get("address1"),
    address2: opt("address2"),
    suburb: form.get("suburb"),
    state: form.get("state"),
    postcode: form.get("postcode"),
    method: form.get("method"),
    giftMessage: opt("giftMessage"),
    giftWrap: form.get("giftWrap") === "on",
    marketingOptIn: form.get("marketingOptIn") === "on",
    discountCode: opt("discountCode"),
    lines,
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { error: fields.lines ?? "Please check the highlighted fields.", fields };
  }
  const d = parsed.data;

  if (stateForPostcode(d.postcode) !== d.state) {
    return { error: "That postcode doesn't match the state you chose.", fields: { postcode: `Not a ${d.state} postcode` } };
  }

  // ── Re-price everything from the database ─────────────────────
  const variants = await prisma.variant.findMany({
    where: { id: { in: d.lines.map((l) => l.variantId) } },
    include: { product: { include: { seller: { select: { id: true, name: true, status: true, gstRegistered: true } } } } },
  });
  type Item = {
    productId: string;
    variantId: string;
    name: string;
    variantLabel: string;
    unitCents: number;
    quantity: number;
    monogram: string | null;
    monogramCents: number;
    sellerId: string | null;
    seller: CartSeller | null;
  };
  const items: Item[] = [];
  for (const l of d.lines) {
    const v = variants.find((x) => x.id === l.variantId);
    if (!v || v.archived || !isVisible(v.product)) return { error: "Something in your cart is no longer available. Please remove it and try again." };
    const alreadyInOrder = items.filter((i) => i.variantId === v.id).reduce((n, i) => n + i.quantity, 0);
    if (v.stock < alreadyInOrder + l.quantity) {
      return {
        error: v.stock > 0
          ? `Only ${v.stock} left of ${v.product.name} (${v.colourName}, ${v.size}). Please update your cart.`
          : `${v.product.name} (${v.colourName}, ${v.size}) has just sold out. Please remove it from your cart.`,
      };
    }
    const monogram = v.product.monogramable ? cleanMonogram(l.monogram) : undefined;
    const seller = v.product.seller;
    items.push({
      productId: v.productId,
      variantId: v.id,
      name: v.product.name,
      variantLabel: v.size === "One size" ? v.colourName : `${v.colourName} · ${v.size}`,
      unitCents: v.priceCents,
      quantity: l.quantity,
      monogram: monogram ?? null,
      monogramCents: monogram ? store.commerce.monogramCents : 0,
      sellerId: seller?.id ?? null,
      // For the shared pricing maths, which groups lines by who ships them
      seller: seller ? { id: seller.id, name: seller.name, gst: seller.gstRegistered } : null,
    });
  }

  const subtotal = items.reduce((s, i) => s + (i.unitCents + i.monogramCents) * i.quantity, 0);

  let discountCode: string | null = null;
  let percentOff = 0;
  if (d.discountCode) {
    const c = await checkDiscount(d.discountCode, d.email, subtotal);
    if (!c.ok) return { error: c.message, fields: { discountCode: c.message } };
    discountCode = c.code;
    percentOff = c.percentOff;
  }

  // One shipment per sender: delivery, free-delivery threshold and GST are worked out per shipment
  const t = totals({
    lines: items.map((i) => ({ ...i, monogram: i.monogram ?? undefined })),
    state: d.state as StateCode,
    method: d.method,
    percentOff,
    giftWrap: d.giftWrap,
  });
  const lineGst = (i: { unitCents: number; monogramCents: number; quantity: number; monogram?: string | null }, registered: boolean) =>
    supplierGst((i.unitCents + i.monogramCents) * i.quantity - lineDiscountCents({ ...i, monogram: i.monogram ?? undefined }, percentOff), registered);

  // ── Create the order (retry if two checkouts race for a number) ──
  let order;
  for (let attempt = 0; ; attempt++) {
    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            number: await nextOrderNumber(),
            accessToken: newAccessToken(),
            email: d.email,
            firstName: d.firstName,
            lastName: d.lastName,
            phone: d.phone ?? null,
            address1: d.address1,
            address2: d.address2 ?? null,
            suburb: d.suburb,
            state: d.state,
            postcode: d.postcode,
            shippingMethod: t.groups.length > 1 ? `${t.shipping.label}, ${t.groups[0].shipping.label.toLowerCase()}` : `${t.shipping.label} (${t.shipping.eta})`,
            shippingCents: t.shipping.cents,
            subtotalCents: t.subtotal,
            discountCode,
            discountCents: t.discount,
            giftWrapCents: t.giftWrap,
            totalCents: t.total,
            gstCents: t.gst,
            giftMessage: d.giftMessage ?? null,
            marketingOptIn: d.marketingOptIn,
          },
        });
        for (const g of t.groups) {
          const shipment = await tx.shipment.create({
            data: {
              orderId: created.id,
              sellerId: g.sellerId,
              merchandiseCents: g.subtotal,
              shippingCents: g.shipping.cents,
              shippingGstCents: supplierGst(g.shipping.cents, g.gstRegistered),
              method: `${g.shipping.label} (${g.shipping.eta})`,
            },
          });
          await tx.orderItem.createMany({
            data: g.lines.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              name: i.name,
              variantLabel: i.variantLabel,
              unitCents: i.unitCents,
              quantity: i.quantity,
              monogramCents: i.monogramCents,
              sellerId: i.sellerId,
              monogram: i.monogram ?? null,
              orderId: created.id,
              shipmentId: shipment.id,
              gstCents: lineGst(i, g.gstRegistered),
            })),
          });
        }
        return created;
      });
      break;
    } catch (e) {
      if (attempt < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  const discount = t.discount;
  const giftWrap = t.giftWrap;

  const orderPath = `/order/${order.number}?t=${order.accessToken}`;
  const stripe = getStripe();

  // ── Demo mode: no payment provider configured ─────────────────
  if (!stripe) {
    await markOrderPaid(order.id);
    redirect(`${orderPath}&thanks=1`);
  }

  // ── Stripe Checkout ───────────────────────────────────────────
  let url: string | null = null;
  try {
    const coupon = discount
      ? await stripe.coupons.create({ amount_off: discount, currency: "aud", duration: "once", max_redemptions: 1, name: discountCode ?? "Discount" })
      : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      customer_email: d.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      line_items: [
        ...items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "aud",
            unit_amount: i.unitCents + i.monogramCents,
            product_data: {
              name: i.name,
              description: `${i.variantLabel}${i.monogram ? ` · Monogram ${i.monogram}` : ""}`,
            },
          },
        })),
        ...(giftWrap
          ? [{ quantity: 1, price_data: { currency: "aud", unit_amount: giftWrap, product_data: { name: "Gift wrapping" } } }]
          : []),
      ],
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: t.groups.length > 1 ? `${t.shipping.label}` : `${t.shipping.label} (${t.shipping.eta})`,
            fixed_amount: { amount: t.shipping.cents, currency: "aud" },
          },
        },
      ],
      // Afterpay needs a shipping address; we've already collected it.
      payment_intent_data: {
        metadata: { orderId: order.id, orderNumber: order.number },
        shipping: {
          name: `${d.firstName} ${d.lastName}`,
          phone: d.phone,
          address: {
            line1: d.address1,
            line2: d.address2,
            city: d.suburb,
            state: d.state,
            postal_code: d.postcode,
            country: "AU",
          },
        },
      },
      success_url: `${store.url}${orderPath}&thanks=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${store.url}/checkout?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    url = session.url;
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", notes: "Stripe session creation failed" } });
    return { error: "We couldn't reach our payment provider. You haven't been charged. Please try again in a moment." };
  }

  if (!url) return { error: "We couldn't start payment. Please try again." };
  redirect(url);
}

export async function previewDiscount(code: string, email: string, subtotalCents: number) {
  if (await rateLimited("discount", 15, 10 * 60_000)) return { ok: false as const, message: "Too many attempts. Try again shortly." };
  return checkDiscount(code, email, subtotalCents);
}
