import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { approvalQueue, balances } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/staff";
import { checkoutOpen, paymentsLive } from "@/lib/stripe";
import { AdminTitle, card, StatusBadge, table } from "./ui";

const PAID = ["PAID", "PACKED", "PARTLY_SHIPPED", "SHIPPED", "DELIVERED"];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function Dashboard() {
  const staff = await requireStaff("dashboard");
  const since = daysAgo(30);
  const [revenue, orderCount, toPack, lowStock, recent] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: PAID }, paidAt: { gte: since } }, _sum: { totalCents: true, gstCents: true } }),
    prisma.order.count({ where: { status: { in: PAID }, paidAt: { gte: since } } }),
    // Our own parcels still to send; sellers ship theirs
    prisma.shipment.count({ where: { sellerId: null, status: { in: ["TO_SHIP", "PACKED"] } } }),
    prisma.variant.findMany({ where: { stock: { lte: 3 }, archived: false, product: { active: true, sellerId: null } }, include: { product: true }, orderBy: { stock: "asc" }, take: 12 }),
    prisma.order.findMany({ where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const total = revenue._sum.totalCents ?? 0;

  // Marketplace, only shown once there are sellers
  const sellerCount = await prisma.seller.count();
  const market = sellerCount
    ? await Promise.all([
        prisma.seller.count({ where: { status: "pending" } }),
        prisma.product.count({ where: approvalQueue }),
        prisma.ledgerEntry.aggregate({ where: { type: { in: ["COMMISSION", "COMMISSION_REFUND"] }, createdAt: { gte: since } }, _sum: { amountCents: true } }),
        can(staff.role, "payouts") ? balances() : Promise.resolve(null),
        prisma.shipment.count({ where: { sellerId: { not: null }, status: { in: ["TO_SHIP", "PACKED"] }, order: { paidAt: { lt: daysAgo(7) } } } }),
      ])
    : null;

  return (
    <>
      <AdminTitle title="Dashboard" />
      {!paymentsLive() && (
        <p className="mb-6 border border-dashed border-sale/40 bg-white p-4 text-sm">
          {checkoutOpen() ? (
            <>
              <strong>Test mode.</strong> STRIPE_SECRET_KEY isn&apos;t set, so checkout creates orders without taking payment.
            </>
          ) : (
            <>
              <strong>Checkout is closed.</strong> Customers can browse and fill a bag, but can&apos;t place orders until
              STRIPE_SECRET_KEY is set.
            </>
          )}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (30 days)" value={formatMoney(total)} sub={`incl. ${formatMoney(revenue._sum.gstCents ?? 0)} GST`} />
        <Stat label="Orders (30 days)" value={String(orderCount)} sub={orderCount ? `avg ${formatMoney(Math.round(total / orderCount))}` : "—"} />
        <Stat label="Waiting to pack" value={String(toPack)} sub="Our parcels not yet sent" href="/admin/orders" highlight={toPack > 0} />
        <Stat label="Low or no stock" value={String(lowStock.length)} sub="Variants with ≤ 3 left" href="/admin/products" highlight={lowStock.length > 0} />
      </div>

      {market && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Seller applications" value={String(market[0])} sub="Waiting for a decision" href="/admin/sellers?status=pending" highlight={market[0] > 0} />
          <Stat label="Listings to approve" value={String(market[1])} sub="New products and changes" href="/admin/approvals" highlight={market[1] > 0} />
          <Stat label="Commission (30 days)" value={formatMoney(-(market[2]._sum.amountCents ?? 0))} sub={market[4] ? `${market[4]} seller order${market[4] === 1 ? "" : "s"} unshipped after 7 days` : "From marketplace sales"} />
          {market[3] && (
            <Stat
              label="Owed to sellers"
              value={formatMoney([...market[3].values()].reduce((n, m) => n + Math.max(0, m.balance), 0))}
              sub={`${formatMoney([...market[3].values()].reduce((n, m) => n + m.available, 0))} payable now`}
              href="/admin/payouts"
            />
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className={card}>
          <div className="mb-3 flex justify-between">
            <h2 className="text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-ink underline">All orders</Link>
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
                    <td>{o.firstName} {o.lastName}<span className="text-grey block text-xs">{o.suburb} {o.state}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-right tabular-nums">{formatMoney(o.totalCents)}</td>
                  </tr>
                ))}
                {!recent.length && <tr><td colSpan={4} className="text-grey py-6 text-center">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-xl">Restock soon</h2>
          <ul className="divide-y divide-line text-sm">
            {lowStock.map((v) => (
              <li key={v.id} className="flex justify-between gap-3 py-2">
                <span>{v.product.name}<span className="text-grey block text-xs">{v.colourName} · {v.size}</span></span>
                <span className={`font-bold ${v.stock <= 0 ? "text-sale" : "text-[#a66a00]"}`}>{v.stock <= 0 ? "Sold out" : `${v.stock} left`}</span>
              </li>
            ))}
            {!lowStock.length && <li className="text-grey py-4">Everything is well stocked.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, sub, href, highlight }: { label: string; value: string; sub: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className={`${card} h-full ${highlight ? "ring-2 ring-ink" : ""}`}>
      <p className="text-grey text-sm">{label}</p>
      <p className="mt-1 text-3xl">{value}</p>
      <p className="text-grey mt-1 text-xs">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
