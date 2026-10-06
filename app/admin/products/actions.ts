"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { DUPLICATE_SKU, isDuplicateSku, parseProductPayload, saveVariants, type SaveState } from "@/lib/catalogue";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";

/** Create or update a product and its options. Photos are handled separately. */
export async function saveProduct(_: SaveState, form: FormData): Promise<SaveState> {
  const staff = await requireStaff("products");

  const parsed = parseProductPayload(form);
  if (!parsed.ok) return parsed.state;
  const { id, variants, details, specs, ...p } = parsed.data;

  const clash = await prisma.product.findFirst({ where: { slug: p.slug, ...(id ? { NOT: { id } } : {}) }, select: { name: true } });
  if (clash) return { error: `The web address /products/${p.slug} is already used by "${clash.name}".`, fields: { slug: "Already in use" } };

  let productId: string;
  let warning = "";
  try {
    productId = await prisma.$transaction(async (tx) => {
      const data = { ...p, details: JSON.stringify(details), specs: JSON.stringify(specs), fromSeed: false };
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });

      warning = await saveVariants(tx, product, variants);
      return product.id;
    });
  } catch (e) {
    if (isDuplicateSku(e)) return DUPLICATE_SKU;
    throw e;
  }

  await audit(staff, id ? "product.update" : "product.create", p.name, {
    href: `/admin/products/${productId}`,
    detail: [`${variants.length} option${variants.length === 1 ? "" : "s"}`, p.active ? "live" : "hidden", warning].filter(Boolean).join(", "),
  });
  revalidatePath("/", "layout");
  const qs = new URLSearchParams({ saved: id ? "1" : "new" });
  if (warning) qs.set("note", warning);
  redirect(`/admin/products/${productId}?${qs}`);
}

export async function deleteProduct(form: FormData) {
  const staff = await requireStaff("products");
  const id = String(form.get("id"));
  const product = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: { images: true, _count: { select: { orderItems: true } } },
  });
  if (product._count.orderItems > 0) {
    // Orders refer to it, so it can't go. Hiding it has the same effect for customers.
    await prisma.product.update({ where: { id }, data: { active: false, fromSeed: false } });
    await audit(staff, "product.hide", product.name, { href: `/admin/products/${id}`, detail: "Tried to delete; hidden because it has orders" });
    redirect(`/admin/products/${id}?note=${encodeURIComponent("This product has orders, so it was hidden from the shop instead of deleted.")}`);
  }
  await prisma.product.delete({ where: { id } });
  await Promise.all(product.images.map((img) => deleteUpload(img.url)));
  await audit(staff, "product.delete", product.name);
  revalidatePath("/", "layout");
  redirect(`/admin/products?deleted=${encodeURIComponent(product.name)}`);
}

/** Removes the starter catalogue in one go, so the shop only shows real stock. */
export async function deleteSampleProducts() {
  const staff = await requireStaff("products");
  const samples = await prisma.product.findMany({
    where: { fromSeed: true },
    select: { id: true, _count: { select: { orderItems: true } } },
  });
  const deletable = samples.filter((s) => s._count.orderItems === 0).map((s) => s.id);
  const ordered = samples.filter((s) => s._count.orderItems > 0).map((s) => s.id);
  await prisma.product.deleteMany({ where: { id: { in: deletable } } });
  await prisma.product.updateMany({ where: { id: { in: ordered } }, data: { active: false } });
  await audit(staff, "product.samples", "Sample catalogue", {
    href: "/admin/products",
    detail: `${deletable.length} deleted${ordered.length ? `, ${ordered.length} hidden because they have orders` : ""}`,
  });
  revalidatePath("/", "layout");
  redirect(`/admin/products?removed=${deletable.length}&hidden=${ordered.length}`);
}

// ── Photos ───────────────────────────────────────────────────────────────────

async function touch(productId: string) {
  const p = await prisma.product.update({ where: { id: productId }, data: { fromSeed: false }, select: { slug: true } });
  revalidatePath(`/products/${p.slug}`);
  revalidatePath(`/admin/products/${productId}`);
}

export async function updateImage(form: FormData) {
  await requireStaff("products");
  const id = String(form.get("id"));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const colourName = String(form.get("colourName") ?? "").trim() || null;
  const img = await prisma.productImage.update({ where: { id }, data: { ...(alt ? { alt } : {}), colourName } });
  await touch(img.productId);
}

export async function moveImage(form: FormData) {
  await requireStaff("products");
  const id = String(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const img = await prisma.productImage.findUniqueOrThrow({ where: { id } });
  const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const i = all.findIndex((a) => a.id === id);
  const j = i + dir;
  if (j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  // Renumber everything so equal sort orders from the old seed data can't tie
  await prisma.$transaction(all.map((a, k) => prisma.productImage.update({ where: { id: a.id }, data: { sortOrder: k } })));
  await touch(img.productId);
}

export async function deleteImage(form: FormData) {
  const staff = await requireStaff("products");
  const id = String(form.get("id"));
  const img = await prisma.productImage.delete({ where: { id }, include: { product: { select: { name: true } } } });
  await deleteUpload(img.url);
  await audit(staff, "product.photos", img.product.name, { href: `/admin/products/${img.productId}`, detail: "Deleted a photo" });
  await touch(img.productId);
}
