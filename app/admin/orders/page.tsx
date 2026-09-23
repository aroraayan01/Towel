import Link from "next/link";

import { requireAdmin } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { AdminTitle, card, StatusBadge, table } from "../ui";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const s = typeof status === "string" && (ORDER_STATUSES as readonly string[]).includes(status) ? status : undefined;
  const query = typeof q === "string" ? q.trim() : "";

  const orders = await prisma.order.findMany({
    where: {
      ...(s ? { status: s } : { status: { not: "PENDING" } }),
      ...(query && {
        OR: [{ number: { contains: query.toUpperCase() } }, { email: { contains: query.toLowerCase() } }, { lastName: { contains: query } }],
      }),
    },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <AdminTitle title="Orders" sub="Unpaid checkouts are hidden unless you filter for them." />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 ${!s ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>All</Link>
        {ORDER_STATUSES.map((x) => (
          <Link key={x} href={`/admin/orders?status=${x}`} className={`rounded-full px-3 py-1 ${s === x ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>
            {STATUS_LABEL[x]}
          </Link>
        ))}
        <form className="ml-auto">
          {s && <input type="hidden" name="status" value={s} />}
          <input name="q" defaultValue={query} placeholder="Order #, email or surname" className="field py-1.5" />
        </form>
      </div>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className={table}>
          <thead>
            <tr><th>Order</th><th>Date</th><th>Customer</th><th>Ship to</th><th>Status</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/orders/${o.number}`} className="font-semibold underline">{o.number}</Link>
                  {o.giftMessage && <span className="ml-1" title="Has a handwritten note">✍️</span>}
                </td>
                <td className="whitespace-nowrap">{o.createdAt.toLocaleDateString("en-AU")}</td>
                <td>{o.firstName} {o.lastName}<span className="text-muted block text-xs">{o.email}</span></td>
                <td>{o.suburb} {o.state}</td>
                <td><StatusBadge status={o.status} /></td>
                <td className="text-right tabular-nums">{formatMoney(o.totalCents)}<span className="text-muted block text-xs">{o._count.items} line{o._count.items === 1 ? "" : "s"}</span></td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6} className="text-muted py-10 text-center">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
