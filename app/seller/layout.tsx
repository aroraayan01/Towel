import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/layout/Logo";
import { prisma } from "@/lib/prisma";
import { currentSellerUser } from "@/lib/seller-auth";
import { sellerLogout } from "./actions";

export const metadata: Metadata = { title: "Seller portal", robots: { index: false, follow: false } };

export default async function SellerLayout({ children }: LayoutProps<"/seller">) {
  const me = await currentSellerUser();
  if (!me) return <div className="flex flex-1 items-center justify-center bg-bone p-4">{children}</div>;

  const [toShip, needsWork] = await Promise.all([
    prisma.shipment.count({ where: { sellerId: me.seller.id, status: { in: ["TO_SHIP", "PACKED"] } } }),
    prisma.product.count({ where: { sellerId: me.seller.id, reviewStatus: "rejected" } }),
  ]);
  const nav: [string, string, number?][] = me.mustChangePassword
    ? []
    : [
        ["/seller", "Dashboard"],
        ["/seller/orders", "Orders", toShip],
        ["/seller/products", "Products", needsWork],
        ["/seller/payouts", "Payments"],
        ["/seller/profile", "Profile"],
      ];

  return (
    <div className="flex flex-1 flex-col bg-bone lg:flex-row">
      <aside className="border-b border-line bg-white lg:w-60 lg:border-r lg:border-b-0">
        <div className="p-5">
          <Link href="/seller">
            <Wordmark />
          </Link>
          <p className="caps mt-3 text-grey">Seller portal</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col" aria-label="Seller">
          {nav.map(([href, label, n]) => (
            <Link key={href} href={href} className="flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-sm font-medium hover:bg-bone">
              {label}
              {!!n && <span className="bg-sale px-2 text-xs font-bold text-white">{n}</span>}
            </Link>
          ))}
          <Link href={`/makers/${me.seller.slug}`} className="text-grey shrink-0 px-3 py-2 text-sm hover:bg-bone" target="_blank">
            Your shop page ↗
          </Link>
          <Link href="/seller/account" className="shrink-0 px-3 py-2 text-sm hover:bg-bone lg:mt-4 lg:border-t lg:border-line lg:pt-4">
            <span className="block font-medium">{me.seller.name}</span>
            <span className="text-grey block text-xs">{me.name} · Your login</span>
          </Link>
          <form action={sellerLogout}>
            <button className="text-grey w-full shrink-0 px-3 py-2 text-left text-sm hover:bg-bone">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
