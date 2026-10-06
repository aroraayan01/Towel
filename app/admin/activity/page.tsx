import Link from "next/link";

import type { Prisma } from "@/app/generated/prisma/client";
import { requireStaff } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";
import { AdminTitle, table } from "../ui";

const PAGE = 100;

const AREAS: Record<string, string> = {
  product: "Products",
  order: "Orders",
  review: "Reviews",
  staff: "Staff",
  auth: "Logins",
  account: "Account",
  subscribers: "Subscribers",
  seller: "Sellers",
  approval: "Approvals",
  payout: "Payouts",
};

const LABEL: Record<string, string> = {
  "auth.login": "Logged in",
  "staff.setup": "Set up the shop admin",
  "staff.create": "Added staff member",
  "staff.role": "Changed role",
  "staff.deactivate": "Switched off account",
  "staff.activate": "Switched account back on",
  "staff.reset": "Reset password",
  "account.password": "Password",
  "product.create": "Created product",
  "product.update": "Edited product",
  "product.delete": "Deleted product",
  "product.hide": "Hid product",
  "product.show": "Showed product",
  "product.samples": "Removed sample products",
  "product.photos": "Photos",
  "order.update": "Updated order",
  "review.approve": "Approved review",
  "review.delete": "Deleted review",
  "subscribers.export": "Exported subscriber list",
  "seller.approve": "Approved seller",
  "seller.reject": "Declined seller application",
  "seller.suspend": "Suspended seller",
  "seller.reactivate": "Reactivated seller",
  "seller.commission": "Changed commission",
  "seller.reset": "Reset seller password",
  "seller.profile": "Seller profile",
  "seller.bank": "Seller bank details",
  "seller.product.submit": "Submitted a product",
  "seller.product.change": "Changed a product",
  "seller.product.delete": "Deleted a product",
  "seller.shipment": "Updated a shipment",
  "approval.product": "Approved new product",
  "approval.changes": "Approved product changes",
  "approval.reject": "Sent back a listing",
  "payout.record": "Recorded payment to seller",
  "payout.adjust": "Adjusted seller balance",
  "payout.bank": "Viewed seller bank details",
  "payout.export": "Downloaded payment list",
};

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireStaff("activity");
  const sp = await searchParams;
  const who = typeof sp.who === "string" ? sp.who : undefined;
  const area = typeof sp.area === "string" && sp.area in AREAS ? sp.area : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = { ...(who ? { staffId: who } : {}), ...(area ? { action: { startsWith: `${area}.` } } : {}) };
  const [entries, staff] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE + 1 }),
    prisma.staffUser.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const more = entries.length > PAGE;

  const link = (patch: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries({ who, area, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/activity${qs.size ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminTitle title="Activity" sub={`Who changed what in admin. Times are ${store.timeZone.split("/")[1].replace("_", " ")} time.`} />

      <form className="mb-4 flex flex-wrap gap-3 text-sm">
        <select name="who" defaultValue={who ?? ""} className="input w-auto py-1.5" aria-label="Person">
          <option value="">Everyone</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="area" defaultValue={area ?? ""} className="input w-auto py-1.5" aria-label="Area">
          <option value="">Everything</option>
          {Object.entries(AREAS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn btn-line h-9 px-4 text-[12px]">Filter</button>
      </form>

      {entries.length === 0 ? (
        <p className="text-grey border border-line bg-white p-8 text-center">Nothing recorded yet.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[40rem]`}>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, PAGE).map((e) => (
                <tr key={e.id}>
                  <td className="text-grey whitespace-nowrap">
                    {e.createdAt.toLocaleString("en-AU", { timeZone: store.timeZone, dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="whitespace-nowrap">{e.staffName}</td>
                  <td>
                    {LABEL[e.action] ?? e.action}:{" "}
                    {e.href ? (
                      <Link href={e.href} className="font-semibold hover:underline">
                        {e.target}
                      </Link>
                    ) : (
                      <span className="font-semibold">{e.target}</span>
                    )}
                    {e.detail && <span className="text-grey block text-xs">{e.detail}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-4 text-sm">
        {page > 1 && (
          <Link href={link({ page: String(page - 1) })} className="hover:underline">
            ← Newer
          </Link>
        )}
        {more && (
          <Link href={link({ page: String(page + 1) })} className="hover:underline">
            Older →
          </Link>
        )}
      </div>
    </>
  );
}
