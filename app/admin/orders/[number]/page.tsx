import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { updateOrder } from "../../actions";
import { card, StatusBadge } from "../../ui";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  await requireAdmin();
  const { number } = await params;
  const o = await prisma.order.findUnique({ where: { number }, include: { items: true } });
  if (!o) notFound();

  return (
    <>
      <Link href="/admin/orders" className="text-grey text-sm hover:underline">← Orders</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{o.number}</h1>
        <StatusBadge status={o.status} />
        <span className="text-grey text-sm">
          Placed {o.createdAt.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
          {o.paidAt && ` · paid ${o.paidAt.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}`}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 text-xl">Items to pack</h2>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <span className="font-semibold">{i.quantity} × {i.name}</span>
                    <span className="text-grey block text-sm">{i.variantLabel}</span>
                    {i.monogram && (
                      <span className="mt-1 inline-block rounded bg-[#f6eed8] px-2 py-0.5 text-sm font-bold tracking-[0.2em]">
                        MONOGRAM: {i.monogram}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatMoney((i.unitCents + i.monogramCents) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <Line label="Subtotal" v={o.subtotalCents} />
              {o.discountCents > 0 && <Line label={`Discount (${o.discountCode})`} v={-o.discountCents} />}
              {o.giftWrapCents > 0 && <Line label="Gift wrap" v={o.giftWrapCents} />}
              <Line label={o.shippingMethod} v={o.shippingCents} />
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
                  <p className="text-grey mt-2 text-sm">Write this card by hand:</p>
                  <p className="mt-1 bg-white p-4 text-2xl">{o.giftMessage}</p>
                </>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 text-xl">Update</h2>
            <form action={updateOrder} className="space-y-4">
              <input type="hidden" name="id" value={o.id} />
              <div>
                <label htmlFor="status" className="field-label">Status</label>
                <select id="status" name="status" defaultValue={o.status} className="input">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="trackingNumber" className="field-label">Tracking number</label>
                <input id="trackingNumber" name="trackingNumber" defaultValue={o.trackingNumber ?? ""} className="input" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify" defaultChecked className="size-4" />
                Email the customer when marked as shipped
              </label>
              <div>
                <label htmlFor="notes" className="field-label">Internal notes</label>
                <textarea id="notes" name="notes" rows={3} defaultValue={o.notes ?? ""} className="input" />
              </div>
              <button className="btn btn-dark w-full">Save</button>
            </form>
            <p className="text-grey mt-3 text-xs">
              Refunds are issued from the Stripe dashboard{o.stripeSessionId ? "" : " (this is a test-mode order with no Stripe payment)"}. Mark the order Refunded here afterwards.
            </p>
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 text-xl">Customer</h2>
            <p>{o.firstName} {o.lastName}</p>
            <p><a href={`mailto:${o.email}?subject=Your order ${o.number}`} className="underline">{o.email}</a></p>
            {o.phone && <p><a href={`tel:${o.phone}`} className="underline">{o.phone}</a></p>}
            <p className="text-grey mt-1">{o.marketingOptIn ? "Opted in to marketing" : "No marketing"}</p>
            <h3 className="mt-4 mb-1 font-sans font-semibold">Ship to</h3>
            <p className="whitespace-pre-line">
              {`${o.firstName} ${o.lastName}\n${o.address1}${o.address2 ? `\n${o.address2}` : ""}\n${o.suburb} ${o.state} ${o.postcode}`}
            </p>
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
