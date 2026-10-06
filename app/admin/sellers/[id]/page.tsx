import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff } from "@/lib/admin-auth";
import { CATEGORIES, isCategory } from "@/lib/collections";
import { parseJson } from "@/lib/json";
import { balanceFor, percent } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_LABEL, type ShipmentStatus } from "@/lib/shipments";
import { can } from "@/lib/staff";
import { store } from "@/lib/store";
import { ActionForm } from "../../ActionForm";
import { adjustBalance } from "../../payouts/actions";
import { AdminTitle, card } from "../../ui";
import { reactivateSeller, resetSellerPassword, suspendSeller, updateSellerTerms } from "../actions";
import { BankReveal } from "../BankReveal";
import { DecisionPanel } from "../DecisionPanel";

const STATUS: Record<string, [string, string]> = {
  pending: ["Application waiting", "bg-[#f6eed8] text-[#7a5a00]"],
  active: ["Active", "bg-forest/10 text-forest"],
  suspended: ["Suspended", "bg-sale/10 text-sale"],
  rejected: ["Declined", "bg-stone text-grey"],
};

const when = (d: Date) => d.toLocaleString("en-AU", { timeZone: store.timeZone, dateStyle: "medium", timeStyle: "short" });

export default async function SellerAdminPage({ params }: PageProps<"/admin/sellers/[id]">) {
  const staff = await requireStaff("sellers");
  const { id } = await params;
  const s = await prisma.seller.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      shipments: { where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 10, include: { order: { select: { number: true } } } },
      _count: { select: { products: true } },
    },
  });
  if (!s) notFound();
  const [productCounts, money, payouts] = await Promise.all([
    prisma.product.groupBy({ by: ["reviewStatus"], where: { sellerId: id }, _count: true }),
    balanceFor(id),
    prisma.payout.findMany({ where: { sellerId: id }, orderBy: { paidAt: "desc" }, take: 5 }),
  ]);
  const pc = (k: string) => productCounts.find((p) => p.reviewStatus === k)?._count ?? 0;
  const categories = parseJson<string[]>(s.categories, []).filter(isCategory);
  const money_ = can(staff.role, "payouts");
  const [statusLabel, statusClass] = STATUS[s.status] ?? [s.status, ""];

  return (
    <>
      <Link href="/admin/sellers" className="text-grey text-sm hover:underline">
        ← Sellers
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle title={s.name} sub={`${s.contactName} · ${s.email}${s.phone ? ` · ${s.phone}` : ""}`} />
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
          {s.status === "active" && (
            <Link href={`/makers/${s.slug}`} target="_blank" className="btn btn-line h-9 px-4 text-[12px]">
              Shop page ↗
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">{s.status === "pending" ? "Application" : "Business"}</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-grey">ABN</dt>
              <dd>
                {s.abn ?? "—"}
                {s.abn && (
                  <a href={`https://abr.business.gov.au/ABN/View?abn=${s.abn.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="text-grey ml-2 underline">
                    Check on ABN Lookup ↗
                  </a>
                )}
              </dd>
              {s.legalName && (
                <>
                  <dt className="text-grey">Legal name</dt>
                  <dd>{s.legalName}</dd>
                </>
              )}
              <dt className="text-grey">GST</dt>
              <dd>{s.gstRegistered ? "Registered" : "Not registered (no GST on their products)"}</dd>
              <dt className="text-grey">Categories</dt>
              <dd>{categories.map((c) => CATEGORIES[c].name).join(", ") || "—"}</dd>
              <dt className="text-grey">Ships from</dt>
              <dd>
                {[s.shipFromSuburb, s.shipFromState, s.shipFromPostcode].filter(Boolean).join(" ")} · within {s.dispatchDays} business days
              </dd>
              {(s.website || s.instagram) && (
                <>
                  <dt className="text-grey">Online</dt>
                  <dd className="space-x-4">
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noreferrer" className="underline">
                        {s.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {s.instagram && (
                      <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="underline">
                        @{s.instagram}
                      </a>
                    )}
                  </dd>
                </>
              )}
              <dt className="text-grey">Applied</dt>
              <dd>
                {when(s.createdAt)}
                {s.agreedTermsAt && " · accepted the seller terms"}
              </dd>
            </dl>
            {s.application && (
              <>
                <h3 className="mt-5 mb-1 text-sm font-semibold">What they told us</h3>
                <p className="text-sm whitespace-pre-line">{s.application}</p>
              </>
            )}
            {s.bio && (
              <>
                <h3 className="mt-5 mb-1 text-sm font-semibold">Shop page introduction</h3>
                <p className="text-grey text-sm whitespace-pre-line">{s.bio}</p>
              </>
            )}
          </section>

          {s.status !== "pending" && (
            <section className={card}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-sans text-[15px] font-semibold">Products</h2>
                <Link href={`/admin/products?seller=${s.id}`} className="text-sm underline">
                  See all {s._count.products}
                </Link>
              </div>
              <p className="text-sm">
                {pc("approved")} approved · {pc("pending")} waiting for review · {pc("rejected")} sent back
              </p>
            </section>
          )}

          {s.shipments.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">Recent orders</h2>
              <ul className="divide-y divide-line text-sm">
                {s.shipments.map((sh) => (
                  <li key={sh.id} className="flex justify-between gap-3 py-2">
                    <Link href={`/admin/orders/${sh.order.number}`} className="underline">
                      #{sh.order.number}
                    </Link>
                    <span className="text-grey flex-1">{when(sh.createdAt)}</span>
                    <span>{SHIPMENT_LABEL[sh.status as ShipmentStatus] ?? sh.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Always rendered in the same place so it keeps the login details after approving */}
          <DecisionPanel sellerId={s.id} sellerName={s.name} status={s.status} commission={s.commissionBps / 100} previousNote={s.statusNote} />

          {(s.status === "active" || s.status === "suspended") && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">Terms and notes</h2>
              <ActionForm action={updateSellerTerms} hidden={{ id: s.id }} submit="Save">
                <label className="block">
                  <span className="field-label">Commission %</span>
                  <input name="commission" defaultValue={s.commissionBps / 100} className="input w-28" inputMode="decimal" />
                  <span className="text-grey mt-1 block text-xs">Currently {percent(s.commissionBps)}. Changes apply to new orders; tell the seller 30 days ahead.</span>
                </label>
                <label className="block">
                  <span className="field-label">Private notes (staff only)</span>
                  <textarea name="internalNotes" rows={3} defaultValue={s.internalNotes ?? ""} className="input" />
                </label>
              </ActionForm>
              <div className="mt-6 border-t border-line pt-5">
                {s.status === "active" ? (
                  <ActionForm
                    action={suspendSeller}
                    hidden={{ id: s.id }}
                    submit="Suspend seller"
                    danger
                    confirmText={`Suspend ${s.name}? Their products are hidden straight away and they're logged out.`}
                  >
                    <label className="block">
                      <span className="field-label">Reason (emailed to them)</span>
                      <textarea name="note" rows={2} className="input" maxLength={1000} />
                    </label>
                  </ActionForm>
                ) : (
                  <>
                    {s.statusNote && <p className="text-grey mb-3 text-sm">Suspended: {s.statusNote}</p>}
                    <ActionForm action={reactivateSeller} hidden={{ id: s.id }} submit="Reactivate seller" />
                  </>
                )}
              </div>
            </section>
          )}

          {s.users.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">Logins</h2>
              <ul className="space-y-4 text-sm">
                {s.users.map((u) => (
                  <li key={u.id}>
                    <p>
                      {u.name} · {u.email}
                    </p>
                    <p className="text-grey text-xs">
                      {u.lastLoginAt ? `Last login ${when(u.lastLoginAt)}` : "Never logged in"}
                      {u.mustChangePassword && " · still on a temporary password"}
                    </p>
                    <div className="mt-2">
                      <ActionForm action={resetSellerPassword} hidden={{ userId: u.id }} submit="Reset password" confirmText={`Give ${u.name} a new temporary password? Their current one stops working.`} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {money_ && s.status !== "pending" && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">Money</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-grey">Payable now</dt>
                  <dd className="tabular-nums">{formatMoney(money.available)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-grey">On hold</dt>
                  <dd className="tabular-nums">{formatMoney(money.onHold)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Balance</dt>
                  <dd className="tabular-nums">{formatMoney(money.balance)}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <BankReveal sellerId={s.id} last4={s.bankLast4} />
              </div>
              {payouts.length > 0 && (
                <ul className="text-grey mt-4 space-y-1 border-t border-line pt-3 text-xs">
                  {payouts.map((p) => (
                    <li key={p.id}>
                      Paid {formatMoney(p.amountCents)} on {p.paidAt.toLocaleDateString("en-AU", { timeZone: store.timeZone })}
                      {p.reference && ` (ref ${p.reference})`} by {p.createdByName}
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-sm">Add an adjustment</summary>
                <div className="mt-3">
                  <ActionForm action={adjustBalance} hidden={{ sellerId: s.id }} submit="Add to statement">
                    <label className="block">
                      <span className="field-label">Amount $ (minus to deduct)</span>
                      <input name="amount" className="input w-36" inputMode="decimal" placeholder="-12.50" />
                    </label>
                    <label className="block">
                      <span className="field-label">What it&apos;s for (they see this)</span>
                      <input name="description" className="input" maxLength={200} placeholder="Partial refund, order #1042" />
                    </label>
                  </ActionForm>
                </div>
              </details>
              <Link href="/admin/payouts" className="mt-4 inline-block text-sm underline">
                Record a payment
              </Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
