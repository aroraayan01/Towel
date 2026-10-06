import { AdminTitle, card } from "@/app/admin/ui";
import { requireSeller } from "@/lib/seller-auth";
import { SellerPasswordForm } from "./SellerPasswordForm";

export default async function SellerAccountPage() {
  const me = await requireSeller({ allowPasswordChange: true });
  return (
    <div className="max-w-md">
      <AdminTitle
        title={me.mustChangePassword ? `Welcome, ${me.name.split(" ")[0]}` : "Your login"}
        sub={me.mustChangePassword ? "Before you start, choose your own password to replace the temporary one." : me.email}
      />
      <section className={card}>
        <SellerPasswordForm first={me.mustChangePassword} />
      </section>
    </div>
  );
}
