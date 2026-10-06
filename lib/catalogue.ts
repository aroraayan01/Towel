import "server-only";

import { z } from "zod";

import { Prisma } from "@/app/generated/prisma/client";
import { collectionBySlug, isCategory } from "./collections";

/**
 * Product validation and option (variant) saving, shared by the admin
 * product editor and the seller portal.
 */
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

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Give the product a name").max(120),
    slug: z.string().trim().toLowerCase().regex(SLUG, "Use lowercase letters, numbers and dashes only, e.g. merino-quilt").max(80),
    category: z.string().refine(isCategory, "Choose a category"),
    collection: z.string(),
    tagline: z.string().trim().max(160),
    description: z.string().trim().min(20, "Write at least a sentence or two describing the product").max(5000),
    details: z.array(z.string().trim().min(1).max(200)).max(20),
    specs: z
      .array(z.object({ label: z.string().trim().min(1, "Every spec needs a label").max(60), value: z.string().trim().min(1, "Every spec needs a value").max(300) }))
      .max(30),
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


export type ProductInput = z.infer<typeof productSchema>;

/** Reads the editor's JSON payload. Returns the data, or the error state to show. */
export function parseProductPayload(form: FormData): { ok: true; data: ProductInput } | { ok: false; state: SaveState } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { ok: false, state: { error: "The form didn't send properly. Reload the page and try again." } };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, state: { error: parsed.error.issues[0]?.message ?? "Check the highlighted fields.", fields } };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Saves a product's options. Removed options are deleted, unless they've been
 * ordered: those are archived (hidden, kept for the order history). Returns a
 * note about archived options, if any.
 */
export async function saveVariants(tx: Prisma.TransactionClient, product: { id: string; slug: string }, variants: ProductInput["variants"]) {
  let warning = "";
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
          sku: v.sku || autoSku(product.slug, v.colourName, v.size),
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
  return warning;
}

/** The fields that describe a product. Seller edits to these wait for approval. */
export const CONTENT_FIELDS = ["name", "tagline", "description", "details", "specs", "material", "care", "category", "collection", "monogramable"] as const;
export type ContentField = (typeof CONTENT_FIELDS)[number];

export const isDuplicateSku = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
export const DUPLICATE_SKU: SaveState = {
  error: "One of the SKUs is already used by another product. Change it, or leave the SKU blank to generate one.",
  fields: { variants: "Duplicate SKU" },
};

// ── Seller listings: content changes wait for approval ───────────────────────

export type ProductContent = {
  name: string;
  tagline: string;
  description: string;
  details: string[];
  specs: { label: string; value: string }[];
  material: string;
  care: string;
  category: string;
  collection: string;
  monogramable: boolean;
};

const parseList = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/** The descriptive fields of a stored product, with JSON columns parsed. */
export function contentOf(p: {
  name: string;
  tagline: string;
  description: string;
  details: string;
  specs: string;
  material: string;
  care: string;
  category: string;
  collection: string;
  monogramable: boolean;
}): ProductContent {
  return {
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    details: parseList<string[]>(p.details, []),
    specs: parseList<{ label: string; value: string }[]>(p.specs, []),
    material: p.material,
    care: p.care,
    category: p.category,
    collection: p.collection,
    monogramable: p.monogramable,
  };
}

/** Fields of `next` that differ from `live`. Empty object when nothing changed. */
export function diffContent(live: ProductContent, next: ProductContent): Partial<ProductContent> {
  const out: Partial<ProductContent> = {};
  for (const k of CONTENT_FIELDS) {
    if (JSON.stringify(live[k]) !== JSON.stringify(next[k])) (out as Record<string, unknown>)[k] = next[k];
  }
  return out;
}

/** Turns content fields into columns for prisma (lists back to JSON). */
export function contentData(c: Partial<ProductContent>) {
  const { details, specs, ...rest } = c;
  return {
    ...rest,
    ...(details ? { details: JSON.stringify(details) } : {}),
    ...(specs ? { specs: JSON.stringify(specs) } : {}),
  };
}

export const FIELD_LABEL: Record<ContentField, string> = {
  name: "Name",
  tagline: "Tagline",
  description: "Description",
  details: "Details",
  specs: "Specifications",
  material: "Material",
  care: "Care",
  category: "Category",
  collection: "Collection",
  monogramable: "Personalisation",
};

/** A web address for a new product that isn't taken, e.g. "linen-throw" or "linen-throw-by-maker". */
export async function uniqueProductSlug(
  db: { product: { findUnique: (args: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null> } },
  name: string,
  makerSlug: string
) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "product";
  const candidates = [base, `${base}-by-${makerSlug}`.slice(0, 80)];
  for (let i = 2; ; i++) {
    const slug = candidates.shift() ?? `${base}-by-${makerSlug}-${i}`.slice(0, 80);
    if (!(await db.product.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}
