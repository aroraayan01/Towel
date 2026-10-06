import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/layout/Logo";
import { currentSellerUser } from "@/lib/seller-auth";
import { store } from "@/lib/store";
import { SellerLoginForm } from "./SellerLoginForm";

export default async function SellerLoginPage() {
  const me = await currentSellerUser();
  if (me) redirect(me.mustChangePassword ? "/seller/account?first=1" : "/seller");
  return (
    <div className="w-full max-w-sm bg-white p-8">
      <Wordmark />
      <h1 className="mt-6 text-2xl">Seller portal</h1>
      <p className="text-grey mt-1 text-sm">For makers who sell through {store.name}.</p>
      <SellerLoginForm />
      <p className="text-grey mt-6 border-t border-line pt-4 text-xs">
        Not a seller yet?{" "}
        <Link href="/sell" className="underline">
          Apply to sell with us
        </Link>
        . Forgotten your password? Email {store.email}.
      </p>
    </div>
  );
}
