import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCart } from "@/components/cart/ClearCart";
import { Photo } from "@/components/Photo";
import { formatMoney } from "@/lib/money";
import { markOrderPaid, STATUS_LABEL, tokenMatches, type OrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const withItems = {
  items: { include: { variant: true, product: { include: { images: { orderBy: { sortOrder: "asc" as const } } } } } },
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Confirmed" },
  { status: "PACKED", label: "Packed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const thanks = sp.thanks === "1";
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;

  let order = await prisma.order.findUnique({ where: { number }, include: withItems });
  // Same 404 for "no such order" and "wrong token" so numbers can't be probed
  if (!order || !tokenMatches(order.accessToken, token)) notFound();

  // Back from Stripe before the webhook arrived: confirm the payment ourselves
  const stripe = getStripe();
  if (order.status === "PENDING" && stripe && sessionId && sessionId === order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await markOrderPaid(order.id);
      order = (await prisma.order.findUnique({ where: { id: order.id }, include: withItems }))!;
    }
  }

  const status = order.status as OrderStatus;
  const step = STEPS.findIndex((s) => s.status === status);
  const pending = status === "PENDING";

  return (
    <div className="page-x max-w-5xl py-10 md:py-16">
      {thanks && !pending && <ClearCart />}

      <p className="caps text-grey">Order #{order.number}</p>
      <h1 className="wide mt-3 text-3xl md:text-[44px]">
        {thanks ? (pending ? "Confirming your payment" : `Thank you, ${order.firstName}`) : STATUS_LABEL[status]}
      </h1>
      <p className="mt-4 max-w-xl text-grey">
        {thanks
          ? pending
            ? "This usually takes a few seconds, sometimes longer with Afterpay. Refresh this page shortly. We'll email you once it's confirmed."
            : `Your order is confirmed and a receipt is on its way to ${order.email}. We'll email tracking details when it ships, usually within 1 to 2 business days.`
          : `Placed ${order.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.`}
      </p>

      {step >= 0 && (
        <ol className="mt-10 grid grid-cols-4 border-t border-line" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.status} className={`-mt-px border-t-2 pt-3 text-[13px] ${i <= step ? "border-ink" : "border-transparent text-grey"}`}>
              {s.label}
              {i <= step && <span className="sr-only"> (done)</span>}
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <p className="mt-8 bg-bone px-5 py-4 text-[14px]">
          Tracking number {order.trackingNumber}.{" "}
          <a
            href={`https://auspost.com.au/mypost/track/details/${encodeURIComponent(order.trackingNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Track with Australia Post
          </a>
        </p>
      )}

      <div className="mt-12 grid gap-12 md:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-[15px]">Items</h2>
          <ul className="mt-3 border-t border-line">
            {order.items.map((i) => {
              // Show the photo of the colour that was ordered
              const img = i.product.images.find((x) => x.colourName === i.variant.colourName) ?? i.product.images[0];
              return (
              <li key={i.id} className="flex gap-4 border-b border-line py-4 text-[14px]">
                <div className="relative aspect-[4/5] w-16 shrink-0 bg-bone">
                  {img && <Photo src={img.url} alt="" sizes="64px" />}
                </div>
                <div className="flex-1">
                  <p>
                    {i.name} × {i.quantity}
                  </p>
                  <p className="text-[13px] text-grey">
                    {i.variantLabel}
                    {i.monogram && `, monogram ${i.monogram}`}
                  </p>
                </div>
                <p className="tabular-nums">{formatMoney((i.unitCents + i.monogramCents) * i.quantity)}</p>
              </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-1.5 text-[14px]">
            <Row label="Subtotal" value={order.subtotalCents} />
            {order.discountCents > 0 && <Row label={`Discount (${order.discountCode})`} value={-order.discountCents} />}
            {order.giftWrapCents > 0 && <Row label="Gift wrap" value={order.giftWrapCents} />}
            <Row label={order.shippingMethod} value={order.shippingCents} />
            <div className="flex justify-between border-t border-line pt-2 text-[16px]">
              <dt>Total</dt>
              <dd>{formatMoney(order.totalCents)}</dd>
            </div>
            <div className="flex justify-between text-[12px] text-grey">
              <dt>Includes GST</dt>
              <dd>{formatMoney(order.gstCents)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-grey">
            Tax invoice. {store.legalName}, ABN {store.abn}.
          </p>
        </div>

        <div className="space-y-8 text-[14px]">
          <div>
            <h2 className="text-[15px]">Delivery address</h2>
            <p className="mt-2 text-grey">
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
              <h2 className="text-[15px]">Gift note</h2>
              <p className="mt-2 text-grey">&ldquo;{order.giftMessage}&rdquo;</p>
            </div>
          )}
          <div>
            <h2 className="text-[15px]">Questions?</h2>
            <p className="mt-2 text-grey">
              Reply to your confirmation email or{" "}
              <Link href={`/contact?order=${order.number}`} className="link">
                contact us
              </Link>{" "}
              with order number #{order.number}.
            </p>
          </div>
          {thanks && (
            <Link href="/shop" className="btn btn-line">
              Continue shopping
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-grey">{label}</dt>
      <dd className="tabular-nums">{value === 0 ? "Free" : value < 0 ? `−${formatMoney(-value)}` : formatMoney(value)}</dd>
    </div>
  );
}
