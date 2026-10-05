"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { endSession, passwordMatches, requireAdmin, startSession } from "@/lib/admin-auth";
import { sendShippedEmail } from "@/lib/email";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";

export async function login(_: string | null, form: FormData) {
  if (await rateLimited("admin-login", 5, 15 * 60_000)) return "Too many attempts. Wait 15 minutes.";
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) return "Admin isn't configured. Set ADMIN_PASSWORD and ADMIN_SECRET.";
  if (!passwordMatches(String(form.get("password") ?? ""))) return "That password isn't right.";
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function updateOrder(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new Error("Bad status");
  const trackingNumber = String(form.get("trackingNumber") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;

  const before = await prisma.order.findUniqueOrThrow({ where: { id } });
  const order = await prisma.order.update({ where: { id }, data: { status, trackingNumber, notes } });

  if (status === "SHIPPED" && before.status !== "SHIPPED" && form.get("notify") === "on") {
    await sendShippedEmail(order);
  }
  revalidatePath("/admin", "layout");
}

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const p = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/", "layout");
}

export async function moderateReview(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  if (form.get("action") === "approve") await prisma.review.update({ where: { id }, data: { approved: true } });
  else await prisma.review.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function markMessage(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const m = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
  await prisma.contactMessage.update({ where: { id }, data: { handled: !m.handled } });
  revalidatePath("/admin", "layout");
}
