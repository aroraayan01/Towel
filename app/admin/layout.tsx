import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/layout/Logo";
import { currentStaff } from "@/lib/admin-auth";
import { approvalQueue } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { can, homeFor, ROLE_INFO, isRole, type Permission } from "@/lib/staff";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await currentStaff();
  if (!staff) return <div className="flex flex-1 items-center justify-center bg-bone p-4">{children}</div>;

  const [toPack, pendingReviews, openMessages, applications, approvals] = await Promise.all([
    // Orders with our own parcel still to send (sellers ship theirs)
    prisma.order.count({ where: { status: { in: ["PAID", "PACKED", "PARTLY_SHIPPED"] }, shipments: { some: { sellerId: null, status: { in: ["TO_SHIP", "PACKED"] } } } } }),
    prisma.review.count({ where: { approved: false } }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.seller.count({ where: { status: "pending" } }),
    prisma.product.count({ where: approvalQueue }),
  ]);
  // Everyone only sees the sections their role allows
  const all: [string, string, Permission, number?][] = [
    ["/admin", "Dashboard", "dashboard"],
    ["/admin/orders", "Orders", "orders", toPack],
    ["/admin/products", "Products", "products"],
    ["/admin/reviews", "Reviews", "reviews", pendingReviews],
    ["/admin/messages", "Messages", "messages", openMessages],
    ["/admin/subscribers", "Subscribers", "subscribers"],
    ["/admin/sellers", "Sellers", "sellers", applications],
    ["/admin/approvals", "Approvals", "approvals", approvals],
    ["/admin/payouts", "Payouts", "payouts"],
    ["/admin/staff", "Staff", "staff"],
    ["/admin/activity", "Activity", "activity"],
  ];
  const nav = staff.mustChangePassword ? [] : all.filter(([, , p]) => can(staff.role, p));

  return (
    <div className="flex flex-1 flex-col bg-bone lg:flex-row">
      <aside className="border-b border-line bg-white lg:w-60 lg:border-r lg:border-b-0">
        <div className="p-5">
          <Link href={homeFor(staff.role)}>
            <Wordmark />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col" aria-label="Admin">
          {nav.map(([href, label, , n]) => (
            <Link key={href} href={href} className="flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-sm font-medium hover:bg-bone">
              {label}
              {!!n && <span className="bg-sale px-2 text-xs font-bold text-white">{n}</span>}
            </Link>
          ))}
          <Link href="/" className="text-grey shrink-0 px-3 py-2 text-sm hover:bg-bone" target="_blank">
            View shop ↗
          </Link>
          <Link href="/admin/account" className="shrink-0 px-3 py-2 text-sm hover:bg-bone lg:mt-4 lg:border-t lg:border-line lg:pt-4">
            <span className="block font-medium">{staff.name}</span>
            <span className="text-grey block text-xs">{isRole(staff.role) ? ROLE_INFO[staff.role].name : staff.role} · Your account</span>
          </Link>
          <form action={logout}>
            <button className="text-grey w-full shrink-0 px-3 py-2 text-left text-sm hover:bg-bone">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
