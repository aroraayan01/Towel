import Link from "next/link";

import { AdminTitle, card } from "@/app/admin/ui";
import { balanceFor, percent } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { store } from "@/lib/store";

/** Whole business days between two dates (Mon–Fri), ignoring public holidays. */
function businessDaysSince(from: Date, to = new Date()) {
  let days = 0;
  const d = new Date(from);
  while (d < to) {
    d.setDate(d.getDate() + 1);
    if (d <= to && d.getDay() !== 0 && d.getDay() !== 6) days++;
  }
  return days;
}

export default async function SellerDashboard({ searchParams }: PageProps<"/seller">) {
  const me = await requireSeller();
  const { welcome } = await searchParams;
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: me.seller.id } });

  const [toShip, products, money, lowStock] = await Promise.all([
    prisma.shipment.findMany({
      where: { sellerId: seller.id, status: { in: ["TO_SHIP", "PACKED"] } },
      include: { order: { select: { number: true, paidAt: true, suburb: true, state: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.groupBy({ by: ["reviewStatus"], where: { sellerId: seller.id }, _count: true }),
    balanceFor(seller.id),
    prisma.variant.findMany({
      where: { archived: false, stock: { lte: 2 }, product: { sellerId: seller.id, active: true } },
      include: { product: { select: { id: true, name: true } } },
      take: 8,
    }),
  ]);
  const pendingChanges = await prisma.product.count({ where: { sellerId: seller.id, pendingChanges: { not: null } } });
  const count = (s: string) => products.find((p) => p.reviewStatus === s)?._count ?? 0;

  const setup = [
    { done: !!seller.bankDetailsEnc, label: "Add your bank details so we can pay you", href: "/seller/profile#bank" },
    { done: !!seller.bio, label: "Write a short introduction for your shop page", href: "/seller/profile" },
    { done: count("approved") + count("pending") + count("rejected") > 0, label: "Add your first product", href: "/seller/products/new" },
  ];

  return (
    <>
      <AdminTitle title={welcome ? `Welcome to ${store.name}, ${me.name.split(" ")[0]}` : me.seller.name} sub={`Commission ${percent(seller.commissionBps)} · ships within ${seller.dispatchDays} business days`} />

      {setup.some((s) => !s.done) && (
        <section className={`${card} mb-6`}>
          <h2 className="mb-3 font-sans text-[15px] font-semibold">Getting set up</h2>
          <ul className="space-y-2 text-sm">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span className={`grid size-5 place-items-center rounded-full text-[11px] ${s.done ? "bg-forest text-white" : "border border-line"}`}>{s.done ? "✓" : ""}</span>
                {s.done ? (
                  <span className="text-grey line-through">{s.label}</span>
                ) : (
                  <Link href={s.href} className="underline">
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders to ship" value={String(toShip.length)} href="/seller/orders" highlight={toShip.length > 0} />
        <Stat label="Ready to be paid" value={formatMoney(money.available)} sub={`${formatMoney(money.onHold)} on hold until after delivery`} href="/seller/payouts" />
        <Stat label="Live products" value={String(count("approved"))} href="/seller/products" />
        <Stat
          label="Waiting for review"
          value={String(count("pending") + pendingChanges)}
          sub={count("rejected") ? `${count("rejected")} need changes` : undefined}
          href="/seller/products"
          highlight={count("rejected") > 0}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-sans text-[15px] font-semibold">To ship</h2>
          {toShip.length === 0 ? (
            <p className="text-grey text-sm">Nothing waiting. New orders are emailed to you as they come in.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {toShip.map((s) => {
                const waited = s.order.paidAt ? businessDaysSince(s.order.paidAt) : 0;
                const late = waited > seller.dispatchDays;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/seller/orders/${s.id}`} className="font-semibold underline">
                      #{s.order.number}
                    </Link>
                    <span className="text-grey flex-1">
                      {s._count.items} item{s._count.items === 1 ? "" : "s"} to {s.order.suburb} {s.order.state}
                    </span>
                    <span className={late ? "text-sale font-semibold" : "text-grey"}>{late ? `${waited} business days, overdue` : waited ? `${waited} business day${waited === 1 ? "" : "s"} ago` : "Today"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-3 font-sans text-[15px] font-semibold">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-grey text-sm">Everything has at least 3 in stock.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 py-2.5">
                  <Link href={`/seller/products/${v.product.id}`} className="underline">
                    {v.product.name}
                  </Link>
                  <span className="text-grey flex-1">
                    {v.colourName} · {v.size}
                  </span>
                  <span className={v.stock === 0 ? "text-sale font-semibold" : ""}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, sub, href, highlight }: { label: string; value: string; sub?: string; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`${card} block hover:border-ink ${highlight ? "border-sale" : ""}`}>
      <p className="text-grey text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-grey mt-1 text-xs">{sub}</p>}
    </Link>
  );
}
