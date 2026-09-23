import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Package, PartyPopper, Truck } from "lucide-react";

import { ClearCart } from "@/components/cart/ClearCart";
import { formatMoney } from "@/lib/money";
import { markOrderPaid, STATUS_LABEL, tokenMatches, type OrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "PAID", label: "Order received", icon: Check },
  { status: "PACKED", label: "Packed with care", icon: Package },
  { status: "SHIPPED", label: "On its way", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: PartyPopper },
];

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const thanks = sp.thanks === "1";
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;

  let order = await prisma.order.findUnique({ where: { number }, include: { items: true } });
  // Same 404 for "no such order" and "wrong token" so numbers can't be probed
  if (!order || !tokenMatches(order.accessToken, token)) notFound();

  // Returning from Stripe before the webhook lands: confirm the payment ourselves
  const stripe = getStripe();
  if (order.status === "PENDING" && stripe && sessionId && sessionId === order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await markOrderPaid(order.id);
      order = (await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } }))!;
    }
  }

  const status = order.status as OrderStatus;
  const stepIndex = STEPS.findIndex((s) => s.status === status);
  const processing = status === "PENDING";

  return (
    <div className="container-page max-w-4xl py-10 sm:py-16">
      {thanks && status !== "PENDING" && <ClearCart />}

      {thanks ? (
        <div className="text-center">
          <p className="font-hand text-3xl text-gum">Thank you, {order.firstName}!</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{processing ? "We're confirming your payment" : "Your order is in"}</h1>
          <p className="text-muted mx-auto mt-4 max-w-xl text-lg">
            {processing
              ? "This usually takes a few seconds (Afterpay can take a little longer). Refresh this page in a moment — you'll also get an email once it's confirmed."
              : `We've emailed a confirmation to ${order.email}. We'll pack it up in the next 1–2 business days and send tracking the moment it leaves us.`}
          </p>
        </div>
      ) : (
        <div>
          <p className="eyebrow">Order {order.number}</p>
          <h1 className="mt-2 text-4xl">{STATUS_LABEL[status]}</h1>
        </div>
      )}

      {stepIndex >= 0 && (
        <ol className="mt-10 grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => {
            const done = i <= stepIndex;
            const Icon = s.icon;
            return (
              <li key={s.status} className="flex flex-col items-center text-center">
                <span className={`relative grid size-11 place-items-center rounded-full ${done ? "bg-gum text-white" : "bg-sand text-muted"}`}>
                  <Icon size={18} />
                </span>
                <span className={`mt-2 text-xs sm:text-sm ${done ? "font-semibold" : "text-muted"}`}>
                  {s.label}
                  {done && <span className="sr-only"> (complete)</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingNumber && (
        <p className="mt-8 rounded-2xl bg-gum-light px-5 py-4 text-center">
          Tracking number <strong>{order.trackingNumber}</strong> ·{" "}
          <a href={`https://auspost.com.au/mypost/track/details/${encodeURIComponent(order.trackingNumber)}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Track with Australia Post
          </a>
        </p>
      )}

      <div className="mt-10 grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-xl">
            Order {order.number}
            <span className="text-muted ml-2 font-sans text-sm">
              {order.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="font-semibold">{i.name}</span> × {i.quantity}
                  <span className="text-muted block">
                    {i.variantLabel}
                    {i.monogram && ` · Monogram ${i.monogram}`}
                  </span>
                </span>
                <span className="tabular-nums">{formatMoney((i.unitCents + i.monogramCents) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <Row label="Subtotal" value={order.subtotalCents} />
            {order.discountCents > 0 && <Row label={`Discount (${order.discountCode})`} value={-order.discountCents} />}
            {order.giftWrapCents > 0 && <Row label="Gift wrapping" value={order.giftWrapCents} />}
            <Row label={order.shippingMethod} value={order.shippingCents} />
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total (AUD)</dt>
              <dd>{formatMoney(order.totalCents)}</dd>
            </div>
            <div className="text-muted flex justify-between text-xs">
              <dt>Includes GST of</dt>
              <dd>{formatMoney(order.gstCents)}</dd>
            </div>
          </dl>
          <p className="text-muted mt-4 text-xs">
            Tax invoice · {store.legalName} · ABN {store.abn}
          </p>
        </div>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="mb-1 font-sans font-semibold">Delivering to</h3>
            <p className="text-[#463f39]">
              {order.firstName} {order.lastName}
              <br />
              {order.address1}
              {order.address2 && (
                <>
                  <br />
                  {order.address2}
                </>
              )}
              <br />
              {order.suburb} {order.state} {order.postcode}
            </p>
          </div>
          {order.giftMessage && (
            <div>
              <h3 className="mb-1 font-sans font-semibold">Your handwritten note</h3>
              <p className="rounded-xl bg-sand p-4 font-hand text-2xl leading-snug">{order.giftMessage}</p>
            </div>
          )}
          <div>
            <h3 className="mb-1 font-sans font-semibold">Need a hand?</h3>
            <p className="text-[#463f39]">
              Reply to your confirmation email or <Link href={`/contact?order=${order.number}`} className="underline">contact us</Link> with your
              order number. A real person will get back to you.
            </p>
          </div>
        </div>
      </div>

      {thanks && (
        <div className="mt-10 rounded-3xl bg-sand p-8 text-center">
          <p className="mx-auto max-w-xl text-lg text-[#463f39]">
            From both of us — thank you. Every order genuinely makes our day, and yours is going out with a little extra love.
          </p>
          <p className="mt-3 font-hand text-3xl text-gum">{store.founders.signOff.split(",")[0]} x</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            Keep browsing
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value === 0 ? "Free" : value < 0 ? `−${formatMoney(-value)}` : formatMoney(value)}</dd>
    </div>
  );
}
