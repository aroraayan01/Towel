import { requireStaff } from "@/lib/admin-auth";
import { ROLE_INFO, isRole } from "@/lib/staff";
import { AdminTitle, card } from "../ui";
import { NameForm, PasswordForm } from "./forms";

export default async function AccountPage() {
  const me = await requireStaff(undefined, { allowPasswordChange: true });
  const role = isRole(me.role) ? ROLE_INFO[me.role] : null;

  if (me.mustChangePassword) {
    return (
      <div className="max-w-md">
        <AdminTitle title={`Welcome, ${me.name.split(" ")[0]}`} sub="Before you start, choose your own password to replace the temporary one." />
        <section className={card}>
          <PasswordForm first />
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <AdminTitle title="Your account" sub={`${me.email} · ${role?.name ?? me.role}`} />
      {role && <p className="text-grey -mt-3 text-sm">{role.blurb}</p>}
      <section className={card}>
        <h2 className="mb-4 font-sans text-[15px] font-semibold">Name</h2>
        <NameForm name={me.name} />
      </section>
      <section className={card}>
        <h2 className="mb-4 font-sans text-[15px] font-semibold">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
