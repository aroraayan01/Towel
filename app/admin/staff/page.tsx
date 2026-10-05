import { requireStaff } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";
import { ROLE_INFO, ROLES } from "@/lib/staff";
import { AdminTitle, card } from "../ui";
import { NewStaffForm, StaffRow } from "./forms";

export default async function StaffPage() {
  const me = await requireStaff("staff");
  const staff = await prisma.staffUser.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] });

  return (
    <div className="max-w-5xl space-y-6">
      <AdminTitle title="Staff" sub="Everyone who can log in to admin. Each person has their own login, and their changes show in the activity log." />

      <section className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="text-grey border-line border-b text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Person</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <StaffRow
                key={`${s.id}|${s.role}|${s.active}`}
                me={s.id === me.id}
                staff={{
                  id: s.id,
                  name: s.name,
                  email: s.email,
                  role: s.role,
                  active: s.active,
                  pending: s.mustChangePassword,
                  lastLogin: s.lastLoginAt
                    ? s.lastLoginAt.toLocaleString("en-AU", { timeZone: store.timeZone, dateStyle: "medium", timeStyle: "short" })
                    : null,
                }}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section className={card}>
        <h2 className="mb-1 font-sans text-[15px] font-semibold">Add someone</h2>
        <p className="text-grey mb-5 text-sm">
          They get a temporary password to log in with once, then choose their own. Nothing is emailed, so send them the details yourself.
        </p>
        <NewStaffForm />
      </section>

      <section className={card}>
        <h2 className="mb-3 font-sans text-[15px] font-semibold">What each role can do</h2>
        <dl className="space-y-2 text-sm">
          {ROLES.map((r) => (
            <div key={r} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold">{ROLE_INFO[r].name}</dt>
              <dd className="text-grey">{ROLE_INFO[r].blurb}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
