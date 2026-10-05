import { requireStaff } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminTitle, card, table } from "../ui";

export default async function SubscribersPage() {
  await requireStaff("subscribers");
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminTitle title="Subscribers" sub={`${subs.length} people want to hear from you.`} />
        <a href="/admin/subscribers/export" className="btn btn-line">Download CSV</a>
      </div>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className={table}>
          <thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}><td>{s.email}</td><td>{s.createdAt.toLocaleDateString("en-AU")}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
