import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { balances } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";
import { ActionForm } from "../ActionForm";
import { AdminTitle, card } from "../ui";
import { recordPayout } from "./actions";

export default async function PayoutsPage() {
  await requireStaff("payouts");
  const [sellers, money, recent] = await Promise.all([
    prisma.seller.findMany({ where: { status: { in: ["active", "suspended"] } }, orderBy: { name: "asc" } }),
    balances(),
    prisma.payout.findMany({ orderBy: { paidAt: "desc" }, take: 15, include: { seller: { select: { name: true } } } }),
  ]);
  const rows = sellers.map((s) => ({ s, m: money.get(s.id) ?? { balance: 0, available: 0, onHold: 0 } })).sort((a, b) => b.m.available - a.m.available);
  const due = rows.filter((r) => r.m.available > 0);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: store.timeZone });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle
          title="Payouts"
          sub={`What each seller is owed. Sales become payable ${store.marketplace.payoutHoldDays} days after the seller ships. Pay by bank transfer, then record it here and the seller is emailed a remittance.`}
        />
        {due.length > 0 && (
          <a href="/admin/payouts/export" className="btn btn-line h-10 px-4 text-[12px]">
            Download payment list (CSV)
          </a>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-grey text-sm">Payable now</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(due.reduce((n, r) => n + r.m.available, 0))}</p>
          <p className="text-grey mt-1 text-xs">
            to {due.length} seller{due.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className={card}>
          <p className="text-grey text-sm">On hold</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(rows.reduce((n, r) => n + r.m.onHold, 0))}</p>
        </div>
        <div className={card}>
          <p className="text-grey text-sm">Owed in total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(rows.reduce((n, r) => n + r.m.balance, 0))}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-grey border border-line bg-white p-10 text-center">No active sellers yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map(({ s, m }) => (
            <section key={s.id} className={`${card} grid gap-4 lg:grid-cols-[1fr_auto]`}>
              <div>
                <Link href={`/admin/sellers/${s.id}`} className="font-semibold hover:underline">
                  {s.name}
                </Link>
                <p className="text-grey text-sm">
                  {formatMoney(m.available)} payable now · {formatMoney(m.onHold)} on hold
                  {m.balance < 0 && <span className="text-sale"> · owes {formatMoney(-m.balance)}</span>}
                </p>
                <p className="text-grey text-xs">
                  {s.bankLast4 ? `${s.bankAccountName}, account ending ${s.bankLast4}` : "No bank details yet"}
                  {s.status === "suspended" && " · suspended"}
                </p>
              </div>
              {m.available > 0 && s.bankLast4 && (
                <ActionForm action={recordPayout} hidden={{ sellerId: s.id }} submit="Record payment" className="flex flex-wrap items-end gap-2">
                  <label>
                    <span className="field-label">Amount $</span>
                    <input name="amount" defaultValue={(m.available / 100).toFixed(2)} className="input w-28 py-2" inputMode="decimal" />
                  </label>
                  <label>
                    <span className="field-label">Paid on</span>
                    <input name="paidAt" type="date" defaultValue={today} className="input w-40 py-2" />
                  </label>
                  <label>
                    <span className="field-label">Reference</span>
                    <input name="reference" className="input w-36 py-2" maxLength={80} placeholder="Bank ref" />
                  </label>
                </ActionForm>
              )}
            </section>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <section className={`${card} mt-8`}>
          <h2 className="mb-3 font-sans text-[15px] font-semibold">Recent payments</h2>
          <ul className="divide-y divide-line text-sm">
            {recent.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-3 py-2">
                <span>{p.seller.name}</span>
                <span className="text-grey">
                  {p.paidAt.toLocaleDateString("en-AU", { timeZone: store.timeZone })}
                  {p.reference && ` · ref ${p.reference}`} · by {p.createdByName}
                </span>
                <span className="tabular-nums">{formatMoney(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
