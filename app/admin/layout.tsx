import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await isAdmin();
  if (!admin) return <div className="flex flex-1 items-center justify-center bg-sand p-4">{children}</div>;

  const [toPack, pendingReviews, openMessages] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.review.count({ where: { approved: false } }),
    prisma.contactMessage.count({ where: { handled: false } }),
  ]);
  const nav: [string, string, number?][] = [
    ["/admin", "Dashboard"],
    ["/admin/orders", "Orders", toPack],
    ["/admin/products", "Products & stock"],
    ["/admin/reviews", "Reviews", pendingReviews],
    ["/admin/messages", "Messages", openMessages],
    ["/admin/subscribers", "Subscribers"],
  ];

  return (
    <div className="flex flex-1 flex-col bg-sand/50 lg:flex-row">
      <aside className="border-b border-line bg-white lg:w-60 lg:border-r lg:border-b-0">
        <div className="p-5">
          <Link href="/admin">
            <Logo />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col" aria-label="Admin">
          {nav.map(([href, label, n]) => (
            <Link key={href} href={href} className="flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sand">
              {label}
              {!!n && <span className="rounded-full bg-clay px-2 text-xs font-bold text-white">{n}</span>}
            </Link>
          ))}
          <Link href="/" className="text-muted shrink-0 rounded-lg px-3 py-2 text-sm hover:bg-sand" target="_blank">
            View shop ↗
          </Link>
          <form action={logout}>
            <button className="text-muted w-full shrink-0 rounded-lg px-3 py-2 text-left text-sm hover:bg-sand">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
