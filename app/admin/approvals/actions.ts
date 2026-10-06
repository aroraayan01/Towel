"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { contentData, type ProductContent } from "@/lib/catalogue";
import { sendListingDecision } from "@/lib/email";
import { parseJson } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";

export type ReviewState = { error?: string } | null;

async function load(id: string) {
  return prisma.product.findUniqueOrThrow({ where: { id }, include: { seller: { select: { email: true, name: true } } } });
}

/** Approve a new product, or a live product's changes and new photos. */
export async function approveListing(form: FormData) {
  const staff = await requireStaff("approvals");
  const p = await load(String(form.get("id")));
  if (!p.seller) redirect("/admin/approvals");
  const isNew = p.reviewStatus !== "approved";
  const changes = parseJson<Partial<ProductContent>>(p.pendingChanges, {});

  await prisma.$transaction([
    prisma.product.update({
      where: { id: p.id },
      data: { ...contentData(changes), pendingChanges: null, reviewStatus: "approved", reviewNote: null },
    }),
    prisma.productImage.updateMany({ where: { productId: p.id, approved: false }, data: { approved: true } }),
  ]);
  await sendListingDecision(p.seller.email, { productName: changes.name ?? p.name, productId: p.id, approved: true, changes: !isNew });
  await audit(staff, isNew ? "approval.product" : "approval.changes", changes.name ?? p.name, {
    href: `/admin/products/${p.id}`,
    detail: `${p.seller.name}: ${isNew ? "new product approved" : "changes approved"}`,
  });
  revalidatePath("/", "layout");
  redirect("/admin/approvals?done=approved");
}

/**
 * Send it back. A new product is marked as needing changes; for a live
 * product the proposed changes and unapproved photos are discarded and the
 * approved version stays up.
 */
export async function rejectListing(_: ReviewState, form: FormData): Promise<ReviewState> {
  const staff = await requireStaff("approvals");
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (note.length < 5) return { error: "Tell the seller what to change. They see this note." };
  const p = await load(String(form.get("id")));
  if (!p.seller) redirect("/admin/approvals");
  const isNew = p.reviewStatus !== "approved";

  if (isNew) {
    await prisma.product.update({ where: { id: p.id }, data: { reviewStatus: "rejected", reviewNote: note } });
  } else {
    const photos = await prisma.productImage.findMany({ where: { productId: p.id, approved: false } });
    await prisma.$transaction([
      prisma.product.update({ where: { id: p.id }, data: { pendingChanges: null, reviewNote: note } }),
      prisma.productImage.deleteMany({ where: { id: { in: photos.map((i) => i.id) } } }),
    ]);
    await Promise.all(photos.map((i) => deleteUpload(i.url)));
  }
  await sendListingDecision(p.seller.email, { productName: p.name, productId: p.id, approved: false, changes: !isNew, note });
  await audit(staff, "approval.reject", p.name, { href: `/admin/products/${p.id}`, detail: `${p.seller.name}: ${note}` });
  revalidatePath("/admin", "layout");
  redirect("/admin/approvals?done=rejected");
}
