"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { sendSellerApproved, sendSellerDecision } from "@/lib/email";
import { percent } from "@/lib/marketplace";
import { hashPassword, temporaryPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";

export type SellerAdminState = { error?: string; ok?: string; credentials?: { email: string; password: string } } | null;

/** "15" or "12.5" (percent) to basis points, or null if it isn't a sensible rate. */
function bps(input: FormDataEntryValue | null) {
  const n = Number(String(input ?? "").replace("%", "").trim());
  if (!Number.isFinite(n) || n < 0 || n > 60) return null;
  return Math.round(n * 100);
}

const reload = (id: string) => {
  revalidatePath(`/admin/sellers/${id}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
};

/** Approve an application (or re-approve a rejected one) and create their login. */
export async function approveSeller(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const id = String(form.get("id"));
  const commissionBps = bps(form.get("commission"));
  if (commissionBps === null) return { error: "Commission must be a percentage between 0 and 60." };
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id }, include: { users: true } });
  if (seller.status === "active") return { error: "This seller is already active." };

  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    await tx.seller.update({ where: { id }, data: { status: "active", statusNote: null, commissionBps, approvedAt: seller.approvedAt ?? new Date() } });
    const existing = seller.users.find((u) => u.email === seller.email);
    if (existing) {
      await tx.sellerUser.update({ where: { id: existing.id }, data: { passwordHash, mustChangePassword: true, active: true, sessionVersion: { increment: 1 } } });
    } else {
      await tx.sellerUser.create({ data: { sellerId: id, email: seller.email, name: seller.contactName, passwordHash } });
    }
  });
  await sendSellerApproved(seller.email, { name: seller.name, contactName: seller.contactName, password, commission: percent(commissionBps) });
  await audit(staff, "seller.approve", seller.name, { href: `/admin/sellers/${id}`, detail: `Commission ${percent(commissionBps)}` });
  reload(id);
  return { ok: `${seller.name} is approved and has been emailed their login.`, credentials: { email: seller.email, password } };
}

export async function rejectSeller(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const id = String(form.get("id"));
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const seller = await prisma.seller.update({ where: { id }, data: { status: "rejected", statusNote: note } });
  await sendSellerDecision(seller.email, {
    contactName: seller.contactName,
    title: `Your application to sell on ${store.name}`,
    message: `Thanks for applying to sell on ${store.name}. We've decided not to go ahead at the moment.`,
    note,
  });
  await audit(staff, "seller.reject", seller.name, { href: `/admin/sellers/${id}`, detail: note ?? undefined });
  reload(id);
  return { ok: "Application declined. They've been emailed." };
}

/** Suspending hides every product and logs the seller out at once. Open orders still need shipping. */
export async function suspendSeller(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const id = String(form.get("id"));
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const seller = await prisma.$transaction(async (tx) => {
    await tx.sellerUser.updateMany({ where: { sellerId: id }, data: { sessionVersion: { increment: 1 } } });
    return tx.seller.update({ where: { id }, data: { status: "suspended", statusNote: note } });
  });
  await sendSellerDecision(seller.email, {
    contactName: seller.contactName,
    title: `Your ${store.name} seller account is on hold`,
    message: `We've put your seller account on hold, so your products aren't showing in the shop. Please still send any open orders.`,
    note,
  });
  await audit(staff, "seller.suspend", seller.name, { href: `/admin/sellers/${id}`, detail: note ?? undefined });
  reload(id);
  return { ok: "Suspended. Their products are hidden and they've been logged out." };
}

export async function reactivateSeller(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const id = String(form.get("id"));
  const seller = await prisma.seller.update({ where: { id }, data: { status: "active", statusNote: null } });
  await sendSellerDecision(seller.email, {
    contactName: seller.contactName,
    title: `Your ${store.name} seller account is active again`,
    message: "Your seller account is active again and your approved products are back in the shop.",
  });
  await audit(staff, "seller.reactivate", seller.name, { href: `/admin/sellers/${id}` });
  reload(id);
  return { ok: "Active again. Their approved products are back in the shop." };
}

export async function updateSellerTerms(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const id = String(form.get("id"));
  const commissionBps = bps(form.get("commission"));
  if (commissionBps === null) return { error: "Commission must be a percentage between 0 and 60." };
  const internalNotes = String(form.get("internalNotes") ?? "").trim().slice(0, 4000) || null;
  const before = await prisma.seller.findUniqueOrThrow({ where: { id } });
  await prisma.seller.update({ where: { id }, data: { commissionBps, internalNotes } });
  if (before.commissionBps !== commissionBps) {
    await audit(staff, "seller.commission", before.name, { href: `/admin/sellers/${id}`, detail: `${percent(before.commissionBps)} → ${percent(commissionBps)} (applies to new orders)` });
  }
  reload(id);
  return { ok: "Saved. A new commission rate applies to orders from now on." };
}

export async function resetSellerPassword(_: SellerAdminState, form: FormData): Promise<SellerAdminState> {
  const staff = await requireStaff("sellers");
  const userId = String(form.get("userId"));
  const password = temporaryPassword();
  const user = await prisma.sellerUser.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, active: true, sessionVersion: { increment: 1 } },
    include: { seller: { select: { id: true, name: true } } },
  });
  await audit(staff, "seller.reset", user.seller.name, { href: `/admin/sellers/${user.seller.id}`, detail: `Password reset for ${user.email}` });
  reload(user.seller.id);
  return { ok: "New temporary password created. Send it to them; it's only shown once.", credentials: { email: user.email, password } };
}
