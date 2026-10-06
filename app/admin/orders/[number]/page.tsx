import Link from "next/link";
import { notFound } from "next/navigation";

import { ShipmentForm } from "@/components/fulfilment/ShipmentForm";
import { requireStaff } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_LABEL, trackingUrl, type ShipmentStatus } from "@/lib/shipments";
import { store } from "@/lib/store";
import { closeOrderAction, updateOrderNotes, updateShipmentAdmin } from "../../actions";
import { ConfirmForm } from "../../ConfirmForm";
import { card, StatusBadge } from "../../ui";

const when = (d: Date) => d.toLocaleString("en-AU", { timeZone: store.timeZone, dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  await requireStaff("orders");
  const { number } = await params;
  const o = await prisma.order.findUnique({
    where: { number },
    include: {
      items: true,
      shipments: { orderBy: { createdAt: "asc" }, include: { seller: { select: { id: true, name: true, dispatchDays: true } } } },
    },
  });
  if (!o) notFound();
  const closed = o.status === "CANCELLED" || o.status === "REFUNDED" || o.status === "PENDING";
  const multi = o.shipments.length > 1;

  return (
    <>
      <Link href="/admin/orders" className="text-grey text-sm hover:underline">
        ← Orders
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{o.number}</h1>
        <StatusBadge status={o.status} />
        <span className="text-grey text-sm">
          Placed {when(o.createdAt)}
          {o.paidAt && ` · paid ${when(o.paidAt)}`}
          {multi && ` · ${o.shipments.length} shipments`}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {o.shipments.map((s) => {
            const items = o.items.filter((i) => i.shipmentId === s.id);
            const track = trackingUrl(s.carrier, s.trackingNumber);
            return (
              <section key={s.id} className={card}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl">
                    {s.seller ? (
                      <>
                        Shipped by{" "}
                        <Link href={`/admin/sellers/${s.seller.id}`} className="underline">
                          {s.seller.name}
                        </Link>
                      </>
                    ) : multi ? (
                      `Shipped by ${store.name}`
                    ) : (
                      "Items to pack"
                    )}
                  </h2>
                  <span className="bg-bone px-2.5 py-0.5 text-xs font-bold">{SHIPMENT_LABEL[s.status as ShipmentStatus] ?? s.status}</span>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4 py-3">
                      <span>
                        <span className="font-semibold">
                          {i.quantity} × {i.name}
                        </span>
                        <span className="text-grey block text-sm">{i.variantLabel}</span>
                        {i.monogram && (
                          <span className="mt-1 inline-block rounded bg-[#f6eed8] px-2 py-0.5 text-sm font-bold tracking-[0.2em]">
                            {s.seller ? "INITIALS" : "MONOGRAM"}: {i.monogram}
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums">{formatMoney((i.unitCents + i.monogramCents) * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-grey mt-2 text-sm">
                  {s.method}: {s.shippingCents ? formatMoney(s.shippingCents) : "free"}
                  {s.shippedAt && ` · shipped ${when(s.shippedAt)}`}
                  {s.trackingNumber && (
                    <>
                      {" · "}
                      {track ? (
                        <a href={track} target="_blank" rel="noreferrer" className="underline">
                          {s.carrier} {s.trackingNumber}
                        </a>
                      ) : (
                        `${s.carrier ?? ""} ${s.trackingNumber}`
                      )}
                    </>
                  )}
                </p>
                {!closed && s.status !== "CANCELLED" && (
                  <div className="mt-4 border-t border-line pt-4">
                    {s.seller && (
                      <p className="text-grey mb-3 text-xs">
                        {s.seller.name} updates this from their seller portal (they have {s.seller.dispatchDays} business days to dispatch). Only change it here to correct something.
                      </p>
                    )}
                    <ShipmentForm
                      key={`${s.status}|${s.carrier ?? ""}|${s.trackingNumber ?? ""}`}
                      action={updateShipmentAdmin}
                      shipment={{ id: s.id, status: s.status, carrier: s.carrier, trackingNumber: s.trackingNumber }}
                      allowCancel
                    />
                  </div>
                )}
              </section>
            );
          })}

          <section className={card}>
            <h2 className="mb-3 text-xl">Payment</h2>
            <dl className="space-y-1 text-sm">
              <Line label="Subtotal" v={o.subtotalCents} />
              {o.discountCents > 0 && <Line label={`Discount (${o.discountCode})`} v={-o.discountCents} />}
              {o.giftWrapCents > 0 && <Line label="Gift wrap" v={o.giftWrapCents} />}
              <Line label="Delivery" v={o.shippingCents} />
              <Line label="Total" v={o.totalCents} bold />
              <Line label="GST included" v={o.gstCents} />
            </dl>
          </section>

          {(o.giftMessage || o.giftWrapCents > 0) && (
            <section className={`${card} bg-[#f6eed8]`}>
              <h2 className="mb-2 text-xl">Gift</h2>
              {o.giftWrapCents > 0 && <p className="font-semibold">Gift wrap this order. Don&apos;t include the invoice.</p>}
              {o.giftMessage && (
                <>
                  <p className="text-grey mt-2 text-sm">Write this card by hand{multi ? " (each maker includes it in their parcel)" : ""}:</p>
                  <p className="mt-1 bg-white p-4 text-2xl">{o.giftMessage}</p>
                </>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 text-xl">Order</h2>
            <p className="text-grey mb-4 text-sm">
              The order&apos;s status follows its shipments. Refunds are issued in the Stripe dashboard
              {o.stripeSessionId ? "" : " (this is a test-mode order with no Stripe payment)"}; mark them here afterwards so sellers&apos; balances are corrected.
            </p>
            <form key={o.notes ?? ""} action={updateOrderNotes} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <label htmlFor="notes" className="field-label">
                Internal notes
              </label>
              <textarea id="notes" name="notes" rows={3} defaultValue={o.notes ?? ""} className="input" />
              <button className="btn btn-line w-full">Save notes</button>
            </form>
            {o.status !== "PENDING" && o.status !== "REFUNDED" && (
              <div className="mt-4 flex gap-3 border-t border-line pt-4">
                {o.status !== "CANCELLED" && (
                  <ConfirmForm
                    action={closeOrderAction}
                    fields={{ id: o.id, status: "CANCELLED" }}
                    label="Cancel order"
                    message="Cancel this order? Shipments that haven't gone out are cancelled and sellers' earnings on it are reversed. Refund the customer in Stripe yourself."
                    className="flex-1"
                  />
                )}
                <ConfirmForm
                  action={closeOrderAction}
                  fields={{ id: o.id, status: "REFUNDED" }}
                  label="Mark refunded"
                  message="Mark this order refunded? Do this after refunding in Stripe. Sellers' earnings on it are reversed."
                  className="flex-1"
                />
              </div>
            )}
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 text-xl">Customer</h2>
            <p>
              {o.firstName} {o.lastName}
            </p>
            <p>
              <a href={`mailto:${o.email}?subject=Your order ${o.number}`} className="underline">
                {o.email}
              </a>
            </p>
            {o.phone && (
              <p>
                <a href={`tel:${o.phone}`} className="underline">
                  {o.phone}
                </a>
              </p>
            )}
            <p className="text-grey mt-1">{o.marketingOptIn ? "Opted in to marketing" : "No marketing"}</p>
            <h3 className="mt-4 mb-1 font-sans font-semibold">Ship to</h3>
            <p className="whitespace-pre-line">{`${o.firstName} ${o.lastName}\n${o.address1}${o.address2 ? `\n${o.address2}` : ""}\n${o.suburb} ${o.state} ${o.postcode}`}</p>
          </section>
        </div>
      </div>
    </>
  );
}

function Line({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <dt className={bold ? "" : "text-grey"}>{label}</dt>
      <dd className="tabular-nums">{v < 0 ? `−${formatMoney(-v)}` : formatMoney(v)}</dd>
    </div>
  );
}
