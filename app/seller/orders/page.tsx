import Link from "next/link";

import { AdminTitle, table } from "@/app/admin/ui";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { SHIPMENT_LABEL, type ShipmentStatus } from "@/lib/shipments";
import { store } from "@/lib/store";

const TABS = [
  ["open", "To ship", ["TO_SHIP", "PACKED"]],
  ["sent", "Shipped", ["SHIPPED", "DELIVERED"]],
  ["cancelled", "Cancelled", ["CANCELLED"]],
] as const;

export default async function SellerOrdersPage({ searchParams }: PageProps<"/seller/orders">) {
  const me = await requireSeller();
  const { tab } = await searchParams;
  const current = TABS.find(([k]) => k === tab) ?? TABS[0];

  const shipments = await prisma.shipment.findMany({
    where: { sellerId: me.seller.id, status: { in: [...current[2]] } },
    include: { order: { select: { number: true, paidAt: true, firstName: true, lastName: true, suburb: true, state: true, giftMessage: true } }, items: true },
    orderBy: { createdAt: current[0] === "open" ? "asc" : "desc" },
    take: 200,
  });

  return (
    <>
      <AdminTitle title="Orders" sub="Pack and post within your dispatch time, then add the tracking number. The customer is emailed when you mark it shipped." />
      <nav className="mb-4 flex gap-1 text-sm" aria-label="Order status">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/seller/orders?tab=${k}`} className={`px-3 py-1.5 ${k === current[0] ? "bg-ink text-white" : "bg-white hover:bg-stone"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {shipments.length === 0 ? (
        <p className="text-grey border border-line bg-white p-10 text-center">{current[0] === "open" ? "Nothing to ship right now." : "No orders here yet."}</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[40rem]`}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Paid</th>
                <th>Items</th>
                <th>Ship to</th>
                <th>Status</th>
                <th className="text-right">Your sale</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/seller/orders/${s.id}`} className="font-semibold underline">
                      #{s.order.number}
                    </Link>
                    {s.order.giftMessage && <span className="text-grey ml-2 text-[11px]">GIFT NOTE</span>}
                    {s.items.some((i) => i.monogram) && <span className="text-grey ml-2 text-[11px]">INITIALS</span>}
                  </td>
                  <td className="whitespace-nowrap">{s.order.paidAt?.toLocaleDateString("en-AU", { timeZone: store.timeZone }) ?? "—"}</td>
                  <td>{s.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</td>
                  <td>
                    {s.order.firstName} {s.order.lastName.slice(0, 1)}.
                    <span className="text-grey block text-xs">
                      {s.order.suburb} {s.order.state}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{SHIPMENT_LABEL[s.status as ShipmentStatus] ?? s.status}</td>
                  <td className="text-right tabular-nums">{formatMoney(s.merchandiseCents + s.shippingCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
