import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTitle, card } from "@/app/admin/ui";
import { ShipmentForm } from "@/components/fulfilment/ShipmentForm";
import { commissionFor, percent } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { SHIPMENT_LABEL, trackingUrl, type ShipmentStatus } from "@/lib/shipments";
import { store } from "@/lib/store";
import { sellerUpdateShipment } from "../../actions";

export default async function SellerOrderPage({ params }: PageProps<"/seller/orders/[id]">) {
  const me = await requireSeller();
  const { id } = await params;
  // Sellers only ever see their own part of an order, and only once it's paid
  const s = await prisma.shipment.findFirst({
    where: { id, sellerId: me.seller.id, status: { not: "PENDING" } },
    include: {
      items: true,
      order: { select: { number: true, paidAt: true, firstName: true, lastName: true, phone: true, address1: true, address2: true, suburb: true, state: true, postcode: true, giftMessage: true } },
      ledger: { select: { type: true, amountCents: true } },
    },
  });
  if (!s) notFound();
  const o = s.order;
  const goods = s.items.reduce((n, i) => n + (i.unitCents + i.monogramCents) * i.quantity, 0);
  const commission = -(s.ledger.find((e) => e.type === "COMMISSION")?.amountCents ?? -commissionFor(goods, me.seller.commissionBps));
  const track = trackingUrl(s.carrier, s.trackingNumber);
  const open = s.status !== "CANCELLED";

  return (
    <>
      <Link href="/seller/orders" className="text-grey text-sm hover:underline">
        ← Orders
      </Link>
      <AdminTitle
        title={`Order #${o.number}`}
        sub={`${SHIPMENT_LABEL[s.status as ShipmentStatus] ?? s.status}${o.paidAt ? ` · paid ${o.paidAt.toLocaleString("en-AU", { timeZone: store.timeZone, dateStyle: "medium", timeStyle: "short" })}` : ""}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">Items to pack</h2>
            <ul className="divide-y divide-line">
              {s.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <span className="font-semibold">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="text-grey block text-sm">{i.variantLabel}</span>
                    {i.monogram && (
                      <span className="mt-1 inline-block rounded bg-[#f6eed8] px-2 py-0.5 text-sm font-bold tracking-[0.2em]">INITIALS: {i.monogram}</span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatMoney((i.unitCents + i.monogramCents) * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          {o.giftMessage && (
            <section className={`${card} bg-[#f6eed8]`}>
              <h2 className="mb-2 font-sans text-[15px] font-semibold">This is a gift</h2>
              <p className="text-grey text-sm">Write this note on a card and put it in the parcel. Don&apos;t include prices.</p>
              <p className="mt-2 bg-white p-4 text-xl">{o.giftMessage}</p>
            </section>
          )}

          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">Your money from this order</h2>
            <dl className="space-y-1 text-sm">
              <Row label="Items" v={goods} />
              <Row label="Delivery the customer paid" v={s.shippingCents} />
              <Row label={`Commission (${percent(me.seller.commissionBps)} of items)`} v={-commission} />
              <Row label="You receive" v={goods + s.shippingCents - commission} bold />
            </dl>
            <p className="text-grey mt-3 text-xs">
              Payable {store.marketplace.payoutHoldDays} days after you mark it shipped. See{" "}
              <Link href="/seller/payouts" className="underline">
                Payments
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-2 font-sans text-[15px] font-semibold">Ship to</h2>
            <p className="whitespace-pre-line text-sm">
              {[`${o.firstName} ${o.lastName}`, o.address1, o.address2, `${o.suburb} ${o.state} ${o.postcode}`, o.phone && `Phone ${o.phone}`].filter(Boolean).join("\n")}
            </p>
            <p className="text-grey mt-3 text-xs">Use these details only to deliver this order.</p>
          </section>

          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">Shipping</h2>
            {s.trackingNumber && (
              <p className="mb-3 text-sm">
                {s.carrier} {s.trackingNumber}
                {track && (
                  <>
                    {" · "}
                    <a href={track} target="_blank" rel="noreferrer" className="underline">
                      Track
                    </a>
                  </>
                )}
              </p>
            )}
            {open ? (
              <ShipmentForm
                key={`${s.status}|${s.carrier ?? ""}|${s.trackingNumber ?? ""}`}
                action={sellerUpdateShipment}
                shipment={{ id: s.id, status: s.status, carrier: s.carrier, trackingNumber: s.trackingNumber }}
              />
            ) : (
              <p className="text-grey text-sm">This order was cancelled. Don&apos;t send it.</p>
            )}
            <p className="text-grey mt-3 text-xs">Can&apos;t send this order? Email {store.email} within one business day and we&apos;ll sort it out with the customer.</p>
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t border-line pt-2 text-base font-semibold" : ""}`}>
      <dt className={bold ? "" : "text-grey"}>{label}</dt>
      <dd className="tabular-nums">{v < 0 ? `−${formatMoney(-v)}` : formatMoney(v)}</dd>
    </div>
  );
}
