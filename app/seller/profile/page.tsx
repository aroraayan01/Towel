import { AdminTitle, card } from "@/app/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { BankForm, ProfileForm } from "./forms";

export default async function SellerProfilePage() {
  const me = await requireSeller();
  const s = await prisma.seller.findUniqueOrThrow({ where: { id: me.seller.id } });

  return (
    <div className="max-w-3xl space-y-6">
      <AdminTitle title="Profile" sub="How your shop appears to customers, where you ship from, and where we pay you." />
      <section className={card}>
        <ProfileForm
          seller={{
            name: s.name,
            bio: s.bio,
            phone: s.phone ?? "",
            website: s.website ?? "",
            instagram: s.instagram ?? "",
            dispatchDays: s.dispatchDays,
            shipFromSuburb: s.shipFromSuburb ?? "",
            shipFromState: s.shipFromState ?? "",
            shipFromPostcode: s.shipFromPostcode ?? "",
            abn: s.abn ?? "",
            legalName: s.legalName ?? "",
            gstRegistered: s.gstRegistered,
          }}
        />
      </section>
      <section className={card} id="bank">
        <h2 className="mb-1 font-sans text-[15px] font-semibold">Bank account for payments</h2>
        <p className="text-grey mb-5 text-sm">
          {s.bankLast4 ? `Currently ${s.bankAccountName}, account ending ${s.bankLast4}.` : "Not added yet. We can't pay you until you add it."} Stored encrypted. You&apos;ll be emailed whenever it changes.
        </p>
        <BankForm hasAccount={!!s.bankLast4} />
      </section>
    </div>
  );
}
