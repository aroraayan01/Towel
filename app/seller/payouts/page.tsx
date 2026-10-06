import { AdminTitle, card, table } from "@/app/admin/ui";
import { balanceFor } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { store } from "@/lib/store";

const TYPE: Record<string, string> = {
  SALE: "Sale",
  COMMISSION: "Commission",
  REFUND: "Refund",
  COMMISSION_REFUND: "Commission returned",
  PAYOUT: "Paid to you",
  ADJUSTMENT: "Adjustment",
};

const day = (d: Date) => d.toLocaleDateString("en-AU", { timeZone: store.timeZone, day: "numeric", month: "short", year: "numeric" });

export default async function SellerPayoutsPage() {
  const me = await requireSeller();
  const [money, entries, seller] = await Promise.all([
    balanceFor(me.seller.id),
    prisma.ledgerEntry.findMany({ where: { sellerId: me.seller.id }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.seller.findUniqueOrThrow({ where: { id: me.seller.id }, select: { bankLast4: true, bankAccountName: true } }),
  ]);
  const now = new Date();

  return (
    <>
      <AdminTitle
        title="Payments"
        sub={`We pay ${store.marketplace.payoutSchedule}. A sale becomes payable ${store.marketplace.payoutHoldDays} days after you ship it, which covers change-of-mind returns.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-grey text-sm">Ready to be paid</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(money.available)}</p>
          <p className="text-grey mt-1 text-xs">{seller.bankLast4 ? `To ${seller.bankAccountName}, account ending ${seller.bankLast4}` : "Add your bank details in Profile"}</p>
        </div>
        <div className={card}>
          <p className="text-grey text-sm">On hold</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(money.onHold)}</p>
          <p className="text-grey mt-1 text-xs">Orders not yet shipped, or shipped in the last {store.marketplace.payoutHoldDays} days</p>
        </div>
        <div className={card}>
          <p className="text-grey text-sm">Total balance</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(money.balance)}</p>
        </div>
      </div>

      <h2 className="mt-10 mb-3 text-xl">Statement</h2>
      {entries.length === 0 ? (
        <p className="text-grey border border-line bg-white p-8 text-center">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[40rem]`}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Payable</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const locked = e.availableAt.getFullYear() > 9000;
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap">{day(e.createdAt)}</td>
                    <td className="whitespace-nowrap">{TYPE[e.type] ?? e.type}</td>
                    <td>{e.description}</td>
                    <td className="text-grey whitespace-nowrap text-xs">
                      {e.type === "PAYOUT" ? "" : locked ? "When shipped" : e.availableAt > now ? `From ${day(e.availableAt)}` : "Now"}
                    </td>
                    <td className={`text-right tabular-nums ${e.amountCents < 0 ? "text-grey" : ""}`}>
                      {e.amountCents < 0 ? `−${formatMoney(-e.amountCents)}` : formatMoney(e.amountCents)}
                    </td>
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
