import Link from "next/link";

import { requireAdmin } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { paymentsLive } from "@/lib/stripe";
import { AdminTitle, card, StatusBadge, table } from "./ui";

const PAID = ["PAID", "PACKED", "SHIPPED", "DELIVERED"];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function Dashboard() {
  await requireAdmin();
  const since = daysAgo(30);
  const [revenue, orderCount, toPack, lowStock, recent] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: PAID }, paidAt: { gte: since } }, _sum: { totalCents: true, gstCents: true } }),
    prisma.order.count({ where: { status: { in: PAID }, paidAt: { gte: since } } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.variant.findMany({ where: { stock: { lte: 3 }, product: { active: true } }, include: { product: true }, orderBy: { stock: "asc" }, take: 12 }),
    prisma.order.findMany({ where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const total = revenue._sum.totalCents ?? 0;

  return (
    <>
      <AdminTitle title="G'day 👋" sub="Here's how the shop's going." />
      {!paymentsLive() && (
        <p className="mb-6 rounded-xl border border-dashed border-clay/50 bg-white p-4 text-sm">
          <strong>Demo mode.</strong> STRIPE_SECRET_KEY isn&apos;t set, so checkout creates orders without taking payment.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (30 days)" value={formatMoney(total)} sub={`incl. ${formatMoney(revenue._sum.gstCents ?? 0)} GST`} />
        <Stat label="Orders (30 days)" value={String(orderCount)} sub={orderCount ? `avg ${formatMoney(Math.round(total / orderCount))}` : "—"} />
        <Stat label="Waiting to pack" value={String(toPack)} sub="Paid, not yet packed" href="/admin/orders?status=PAID" highlight={toPack > 0} />
        <Stat label="Low or no stock" value={String(lowStock.length)} sub="Variants with ≤ 3 left" href="/admin/products" highlight={lowStock.length > 0} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className={card}>
          <div className="mb-3 flex justify-between">
            <h2 className="text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-gum underline">All orders</Link>
          </div>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.number}`} className="font-semibold underline">{o.number}</Link></td>
                    <td>{o.firstName} {o.lastName}<span className="text-muted block text-xs">{o.suburb} {o.state}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-right tabular-nums">{formatMoney(o.totalCents)}</td>
                  </tr>
                ))}
                {!recent.length && <tr><td colSpan={4} className="text-muted py-6 text-center">No orders yet — they&apos;ll appear here.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-xl">Restock soon</h2>
          <ul className="divide-y divide-line text-sm">
            {lowStock.map((v) => (
              <li key={v.id} className="flex justify-between gap-3 py-2">
                <span>{v.product.name}<span className="text-muted block text-xs">{v.colourName} · {v.size}</span></span>
                <span className={`font-bold ${v.stock <= 0 ? "text-clay" : "text-[#a66a00]"}`}>{v.stock <= 0 ? "Sold out" : `${v.stock} left`}</span>
              </li>
            ))}
            {!lowStock.length && <li className="text-muted py-4">Everything is well stocked.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, sub, href, highlight }: { label: string; value: string; sub: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className={`${card} h-full ${highlight ? "ring-2 ring-wattle" : ""}`}>
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
      <p className="text-muted mt-1 text-xs">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
