import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { balances, percent } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/staff";
import { store } from "@/lib/store";
import { AdminTitle, table } from "../ui";

const TABS = [
  ["pending", "Applications"],
  ["active", "Active"],
  ["suspended", "Suspended"],
  ["rejected", "Declined"],
] as const;

export default async function SellersPage({ searchParams }: PageProps<"/admin/sellers">) {
  const staff = await requireStaff("sellers");
  const { status } = await searchParams;
  const counts = await prisma.seller.groupBy({ by: ["status"], _count: true });
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const current = TABS.find(([k]) => k === status)?.[0] ?? (n("pending") ? "pending" : "active");

  const [sellers, money] = await Promise.all([
    prisma.seller.findMany({
      where: { status: current },
      include: { _count: { select: { products: true } } },
      orderBy: current === "pending" ? { createdAt: "asc" } : { name: "asc" },
    }),
    balances(),
  ]);
  const showMoney = can(staff.role, "payouts");

  return (
    <>
      <AdminTitle title="Sellers" sub="Independent makers selling through the shop. They apply on the Sell with us page." />
      <nav className="mb-4 flex flex-wrap gap-1 text-sm" aria-label="Seller status">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/sellers?status=${k}`} className={`px-3 py-1.5 ${k === current ? "bg-ink text-white" : "bg-white hover:bg-stone"}`}>
            {label}
            {n(k) > 0 && <span className="ml-1.5 opacity-70">{n(k)}</span>}
          </Link>
        ))}
        <Link href="/sell" target="_blank" className="text-grey ml-auto px-3 py-1.5 hover:underline">
          Sell with us page ↗
        </Link>
      </nav>

      {sellers.length === 0 ? (
        <p className="text-grey border border-line bg-white p-10 text-center">
          {current === "pending" ? `No applications waiting. Makers apply at ${store.url.replace(/^https?:\/\//, "")}/sell.` : "None."}
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[44rem]`}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>{current === "pending" ? "Applied" : "Products"}</th>
                <th>Commission</th>
                <th>Ships from</th>
                {showMoney && current !== "pending" && <th className="text-right">Owed</th>}
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => {
                const m = money.get(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/admin/sellers/${s.id}`} className="font-semibold hover:underline">
                        {s.name}
                      </Link>
                      <span className="text-grey block text-xs">
                        {s.contactName} · {s.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {current === "pending" ? s.createdAt.toLocaleDateString("en-AU", { timeZone: store.timeZone }) : s._count.products}
                    </td>
                    <td>{percent(s.commissionBps)}</td>
                    <td>{[s.shipFromSuburb, s.shipFromState].filter(Boolean).join(" ")}</td>
                    {showMoney && current !== "pending" && (
                      <td className="text-right tabular-nums">
                        {formatMoney(m?.balance ?? 0)}
                        {!!m?.available && <span className="text-grey block text-xs">{formatMoney(m.available)} payable now</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
