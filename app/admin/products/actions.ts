"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { collectionBySlug, isCategory } from "@/lib/collections";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";

export type SaveState = { error: string; fields?: Record<string, string> } | null;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;

const dollars = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(0, `${label} can't be negative`)
    .max(100000, `${label} looks too high`)
    .transform((n) => Math.round(n * 100));

const variantSchema = z.object({
  id: z.string().optional(),
  colourName: z.string().trim().min(1, "Every option needs a colour name (use \"Natural\" or \"One colour\" if there's only one)").max(40),
  colourHex: z.string().regex(HEX, "Pick a swatch colour"),
  size: z.string().trim().min(1, "Every option needs a size (use \"One size\" if there's only one)").max(40),
  price: dollars("Price"),
  compareAt: z.union([z.literal(""), dollars("Was price")]).optional(),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative").max(100000),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .max(60)
    .regex(/^[A-Z0-9-]*$/, "SKUs can only use letters, numbers and dashes")
    .optional(),
});

const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Give the product a name").max(120),
    slug: z.string().trim().toLowerCase().regex(SLUG, "Use lowercase letters, numbers and dashes only, e.g. merino-quilt").max(80),
    category: z.string().refine(isCategory, "Choose a category"),
    collection: z.string(),
    tagline: z.string().trim().max(160),
    description: z.string().trim().min(20, "Write at least a sentence or two describing the product").max(5000),
    details: z.array(z.string().trim().min(1).max(200)).max(20),
    material: z.string().trim().max(200),
    care: z.string().trim().max(1000),
    active: z.boolean(),
    featured: z.boolean(),
    bestseller: z.boolean(),
    isNew: z.boolean(),
    monogramable: z.boolean(),
    variants: z.array(variantSchema).min(1, "Add at least one option with a price").max(200),
  })
  .superRefine((p, ctx) => {
    if (collectionBySlug(p.collection)?.category !== p.category) {
      ctx.addIssue({ code: "custom", path: ["collection"], message: "Choose a collection in this category" });
    }
    const seen = new Set<string>();
    for (const v of p.variants) {
      const key = `${v.colourName.toLowerCase()}|${v.size.toLowerCase()}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["variants"], message: `"${v.colourName} / ${v.size}" is listed twice` });
      }
      seen.add(key);
      if (typeof v.compareAt === "number" && v.compareAt > 0 && v.compareAt <= v.price) {
        ctx.addIssue({ code: "custom", path: ["variants"], message: `The "was" price for ${v.colourName} / ${v.size} must be higher than its price` });
      }
    }
  });

const skuPart = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const autoSku = (slug: string, colour: string, size: string) => ["XO", skuPart(slug), skuPart(colour), skuPart(size)].join("-");

/** Create or update a product and its options. Photos are handled separately. */
export async function saveProduct(_: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { error: "The form didn't send properly. Reload the page and try again." };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Check the highlighted fields.", fields };
  }
  const { id, variants, details, ...p } = parsed.data;

  const clash = await prisma.product.findFirst({ where: { slug: p.slug, ...(id ? { NOT: { id } } : {}) }, select: { name: true } });
  if (clash) return { error: `The web address /products/${p.slug} is already used by "${clash.name}".`, fields: { slug: "Already in use" } };

  let productId: string;
  let warning = "";
  try {
    productId = await prisma.$transaction(async (tx) => {
      const data = { ...p, details: JSON.stringify(details), fromSeed: false };
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });

      const existing = await tx.variant.findMany({
        where: { productId: product.id },
        include: { _count: { select: { orderItems: true } } },
      });
      const keep = new Set(variants.map((v) => v.id).filter(Boolean));

      // Options that were removed: delete them, unless they've been ordered (then
      // they have to stay for the order history, so they're just set to 0 stock)
      const removed = existing.filter((e) => !keep.has(e.id) && !e.archived);
      const ordered = removed.filter((e) => e._count.orderItems > 0);
      if (ordered.length) {
        await tx.variant.updateMany({ where: { id: { in: ordered.map((e) => e.id) } }, data: { archived: true, stock: 0 } });
        warning = `${ordered.length} removed option${ordered.length > 1 ? "s are" : " is"} hidden from the shop but kept on file, because ${ordered.length > 1 ? "they've" : "it's"} been ordered before.`;
      }
      await tx.variant.deleteMany({ where: { id: { in: removed.filter((e) => e._count.orderItems === 0).map((e) => e.id) } } });

      for (const [i, v] of variants.entries()) {
        const row = {
          sku: v.sku || autoSku(p.slug, v.colourName, v.size),
          colourName: v.colourName,
          colourHex: v.colourHex.toLowerCase(),
          accentHex: v.colourHex.toLowerCase(),
          size: v.size,
          priceCents: v.price,
          compareAtCents: typeof v.compareAt === "number" && v.compareAt > 0 ? v.compareAt : null,
          stock: v.stock,
          sortOrder: i,
          archived: false,
        };
        // A new row for a colour and size that was archived earlier brings that option back
        const match = v.id
          ? existing.find((e) => e.id === v.id)
          : existing.find((e) => e.archived && e.colourName.toLowerCase() === v.colourName.toLowerCase() && e.size.toLowerCase() === v.size.toLowerCase());
        if (match) await tx.variant.update({ where: { id: match.id }, data: row });
        else await tx.variant.create({ data: { ...row, productId: product.id } });
      }

      // Photos tied to a colour that no longer exists now show for every colour
      const colours = [...new Set(variants.map((v) => v.colourName))];
      await tx.productImage.updateMany({
        where: { productId: product.id, colourName: { not: null, notIn: colours } },
        data: { colourName: null },
      });
      return product.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "One of the SKUs is already used by another product. Change it, or leave the SKU blank to generate one.", fields: { variants: "Duplicate SKU" } };
    }
    throw e;
  }

  revalidatePath("/", "layout");
  const qs = new URLSearchParams({ saved: id ? "1" : "new" });
  if (warning) qs.set("note", warning);
  redirect(`/admin/products/${productId}?${qs}`);
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const product = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: { images: true, _count: { select: { orderItems: true } } },
  });
  if (product._count.orderItems > 0) {
    // Orders refer to it, so it can't go. Hiding it has the same effect for customers.
    await prisma.product.update({ where: { id }, data: { active: false, fromSeed: false } });
    redirect(`/admin/products/${id}?note=${encodeURIComponent("This product has orders, so it was hidden from the shop instead of deleted.")}`);
  }
  await prisma.product.delete({ where: { id } });
  await Promise.all(product.images.map((img) => deleteUpload(img.url)));
  revalidatePath("/", "layout");
  redirect(`/admin/products?deleted=${encodeURIComponent(product.name)}`);
}

/** Removes the starter catalogue in one go, so the shop only shows real stock. */
export async function deleteSampleProducts() {
  await requireAdmin();
  const samples = await prisma.product.findMany({
    where: { fromSeed: true },
    select: { id: true, _count: { select: { orderItems: true } } },
  });
  const deletable = samples.filter((s) => s._count.orderItems === 0).map((s) => s.id);
  const ordered = samples.filter((s) => s._count.orderItems > 0).map((s) => s.id);
  await prisma.product.deleteMany({ where: { id: { in: deletable } } });
  await prisma.product.updateMany({ where: { id: { in: ordered } }, data: { active: false } });
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
  await requireAdmin();
  const id = String(form.get("id"));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const colourName = String(form.get("colourName") ?? "").trim() || null;
  const img = await prisma.productImage.update({ where: { id }, data: { ...(alt ? { alt } : {}), colourName } });
  await touch(img.productId);
}

export async function moveImage(form: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  const id = String(form.get("id"));
  const img = await prisma.productImage.delete({ where: { id } });
  await deleteUpload(img.url);
  await touch(img.productId);
}
