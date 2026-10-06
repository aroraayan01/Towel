"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { endSession, requireStaff, setupPasswordMatches, startSession } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { closeOrder, updateShipment } from "@/lib/fulfilment";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { dummyHash, hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { rateLimited, rateLimitedKey } from "@/lib/rate-limit";
import { homeFor } from "@/lib/staff";
import { store } from "@/lib/store";

// ── Logging in ───────────────────────────────────────────────────────────────

export async function login(_: string | null, form: FormData) {
  if (!process.env.ADMIN_SECRET) return "Admin isn't configured. Set ADMIN_SECRET on the server.";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if ((await rateLimited("admin-login", 10, 15 * 60_000)) || rateLimitedKey("admin-login", email, 5, 15 * 60_000)) {
    return "Too many attempts. Wait 15 minutes and try again.";
  }

  const staff = await prisma.staffUser.findUnique({ where: { email } });
  // Check a password either way, so a wrong email takes as long as a wrong password
  const ok = await verifyPassword(password, staff?.passwordHash ?? (await dummyHash()));
  if (!staff || !ok) return "That email and password don't match.";
  if (!staff.active) return "This account has been switched off. Ask the shop owner.";

  await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
  await audit(staff, "auth.login", staff.email);
  await startSession(staff);
  redirect(staff.mustChangePassword ? "/admin/account?first=1" : homeFor(staff.role));
}

const ownerSchema = z.object({
  serverPassword: z.string().min(1, "Enter the current admin password"),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string(),
});

/**
 * Creates the first owner account. Only works while there are no staff accounts
 * at all, and needs the server's ADMIN_PASSWORD, so only whoever runs the
 * server can do it.
 */
export async function setupOwner(_: string | null, form: FormData) {
  if (await rateLimited("admin-setup", 5, 15 * 60_000)) return "Too many attempts. Wait 15 minutes and try again.";
  if ((await prisma.staffUser.count()) > 0) redirect("/admin/login");

  const parsed = ownerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return parsed.error.issues[0].message;
  const d = parsed.data;
  if (!setupPasswordMatches(d.serverPassword)) return "The current admin password isn't right.";
  const weak = passwordProblem(d.password, [d.name, d.email.split("@")[0], store.name]);
  if (weak) return `New password: ${weak}`;
  if (d.password === d.serverPassword) return "Choose a new password, not the current admin password.";

  const owner = await prisma.staffUser.create({
    data: { name: d.name, email: d.email, role: "owner", passwordHash: await hashPassword(d.password), mustChangePassword: false, lastLoginAt: new Date() },
  });
  await audit(owner, "staff.setup", owner.email, { detail: "Created the owner account" });
  await startSession(owner);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ── Orders, products, reviews, messages ──────────────────────────────────────

export async function updateOrderNotes(form: FormData) {
  const staff = await requireStaff("orders");
  const id = String(form.get("id"));
  const notes = String(form.get("notes") ?? "").trim() || null;
  const order = await prisma.order.update({ where: { id }, data: { notes } });
  await audit(staff, "order.update", `Order #${order.number}`, { href: `/admin/orders/${order.number}`, detail: "notes edited" });
  revalidatePath("/admin", "layout");
}

/** Cancel or refund the whole order. Sellers' earnings on it are reversed. */
export async function closeOrderAction(form: FormData) {
  const staff = await requireStaff("orders");
  const id = String(form.get("id"));
  const status = form.get("status") === "REFUNDED" ? "REFUNDED" : "CANCELLED";
  const before = await prisma.order.findUniqueOrThrow({ where: { id } });
  if (before.status === status) return;
  await closeOrder(id, status);
  await audit(staff, "order.update", `Order #${before.number}`, {
    href: `/admin/orders/${before.number}`,
    detail: `${STATUS_LABEL[before.status as OrderStatus] ?? before.status} → ${STATUS_LABEL[status]}`,
  });
  revalidatePath("/admin", "layout");
}

/** Update one shipment. For xomexo's own parcels; sellers normally update theirs in the seller portal. */
export async function updateShipmentAdmin(form: FormData) {
  const staff = await requireStaff("orders");
  const id = String(form.get("id"));
  const detail = await updateShipment(
    id,
    {
      status: String(form.get("status")),
      carrier: String(form.get("carrier") ?? ""),
      trackingNumber: String(form.get("trackingNumber") ?? ""),
      notify: form.get("notify") === "on",
    },
    { allowCancel: true }
  );
  const s = await prisma.shipment.findUniqueOrThrow({ where: { id }, include: { order: { select: { number: true } }, seller: { select: { name: true } } } });
  if (detail) {
    await audit(staff, "order.update", `Order #${s.order.number}`, {
      href: `/admin/orders/${s.order.number}`,
      detail: `${s.seller ? `${s.seller.name} shipment: ` : ""}${detail}`,
    });
  }
  revalidatePath("/admin", "layout");
}

export async function toggleProduct(form: FormData) {
  const staff = await requireStaff("products");
  const id = String(form.get("id"));
  const p = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { active: !p.active } });
  await audit(staff, p.active ? "product.hide" : "product.show", p.name, { href: `/admin/products/${p.id}` });
  revalidatePath("/", "layout");
}

export async function moderateReview(form: FormData) {
  const staff = await requireStaff("reviews");
  const id = String(form.get("id"));
  const review = await prisma.review.findUniqueOrThrow({ where: { id }, include: { product: { select: { name: true } } } });
  if (form.get("action") === "approve") {
    await prisma.review.update({ where: { id }, data: { approved: true } });
    await audit(staff, "review.approve", review.product.name, { detail: `${review.rating}★ from ${review.name}` });
  } else {
    await prisma.review.delete({ where: { id } });
    await audit(staff, "review.delete", review.product.name, { detail: `${review.rating}★ from ${review.name}` });
  }
  revalidatePath("/", "layout");
}

export async function markMessage(form: FormData) {
  await requireStaff("messages");
  const id = String(form.get("id"));
  const m = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
  await prisma.contactMessage.update({ where: { id }, data: { handled: !m.handled } });
  revalidatePath("/admin", "layout");
}
