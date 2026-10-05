import { redirect } from "next/navigation";

import { Wordmark } from "@/components/layout/Logo";
import { currentStaff } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { homeFor } from "@/lib/staff";
import { LoginForm, OwnerSetupForm } from "./LoginForm";

export default async function LoginPage() {
  const staff = await currentStaff();
  if (staff) redirect(staff.mustChangePassword ? "/admin/account?first=1" : homeFor(staff.role));

  // No accounts yet: the first visit sets up the owner
  const firstRun = (await prisma.staffUser.count()) === 0;

  return (
    <div className="w-full max-w-sm bg-white p-8">
      <Wordmark />
      {firstRun ? (
        <>
          <h1 className="mt-6 text-2xl">Set up the owner account</h1>
          <p className="text-grey mt-2 text-sm">
            This is the account you&apos;ll log in with from now on, and the one that adds staff. To prove you run the shop, enter
            the current admin password (the one printed when the server was installed) as well.
          </p>
          <OwnerSetupForm />
        </>
      ) : (
        <>
          <h1 className="mt-6 text-2xl">Shop admin</h1>
          <LoginForm />
        </>
      )}
    </div>
  );
}
