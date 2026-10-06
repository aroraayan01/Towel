"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { audit } from "@/lib/audit";
import {
  contentData,
  contentOf,
  diffContent,
  DUPLICATE_SKU,
  isDuplicateSku,
  parseProductPayload,
  saveVariants,
  uniqueProductSlug,
  type ProductContent,
  type SaveState,
} from "@/lib/catalogue";
import { sendBankDetailsChanged } from "@/lib/email";
import { updateShipment } from "@/lib/fulfilment";
import { formatAbn, validAbn } from "@/lib/marketplace";
import { dummyHash, hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { rateLimited, rateLimitedKey } from "@/lib/rate-limit";
import { seal } from "@/lib/secretbox";
import { endSellerSession, requireSeller, startSellerSession } from "@/lib/seller-auth";
import { STATES } from "@/lib/shipping";
import { store } from "@/lib/store";
import { deleteUpload } from "@/lib/uploads";

export type PortalState = { error?: string; ok?: string } | null;

/** Seller actions go in the shop's activity log as "Maker name (person)". */
const log = (u: { name: string; seller: { name: string } }, action: string, target: string, opts?: { href?: string; detail?: string }) =>
  audit({ id: null, name: `${u.seller.name} (${u.name})` }, action, target, opts);

// ── Logging in ───────────────────────────────────────────────────────────────

export async function sellerLogin(_: string | null, form: FormData) {
  if (!process.env.ADMIN_SECRET) return "The seller portal isn't configured yet.";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if ((await rateLimited("seller-login", 10, 15 * 60_000)) || rateLimitedKey("seller-login", email, 5, 15 * 60_000)) {
    return "Too many attempts. Wait 15 minutes and try again.";
  }
  const user = await prisma.sellerUser.findUnique({ where: { email }, include: { seller: { select: { status: true, name: true } } } });
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) return "That email and password don't match.";
  if (!user.active) return "This login has been switched off. Contact us.";
  if (user.seller.status === "suspended") return `Your seller account is suspended. Email ${store.email} for help.`;
  if (user.seller.status !== "active") return `Your seller account isn't active. Email ${store.email} for help.`;

  await prisma.sellerUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSellerSession(user);
  redirect(user.mustChangePassword ? "/seller/account?first=1" : "/seller");
}

export async function sellerLogout() {
  await endSellerSession();
  redirect("/seller/login");
}

export async function sellerChangePassword(_: PortalState, form: FormData): Promise<PortalState> {
  const me = await requireSeller({ allowPasswordChange: true });
  if (await rateLimited("seller-password", 10, 15 * 60_000)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("confirm") ?? "")) return { error: "The two new passwords don't match." };
  const row = await prisma.sellerUser.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(current, row.passwordHash))) return { error: "Your current password isn't right." };
  if (next === current) return { error: "Choose a different password from the current one." };
  const weak = passwordProblem(next, [row.name, row.email.split("@")[0], me.seller.name, store.name]);
  if (weak) return { error: weak };

  const updated = await prisma.sellerUser.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false, sessionVersion: { increment: 1 } },
  });
  await startSellerSession(updated);
  if (row.mustChangePassword) redirect("/seller?welcome=1");
  return { ok: "Password changed. Any other devices you were logged in on have been signed out." };
}

// ── Profile and bank details ─────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your shop name").max(80),
  bio: z.string().trim().max(2000),
  phone: z.string().trim().max(20).regex(/^[0-9 +()-]*$/, "Phone: numbers only"),
  website: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
    .pipe(z.union([z.literal(""), z.string().url("Enter a web address, e.g. yourshop.com.au")])),
  instagram: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "")),
  dispatchDays: z.coerce.number().int().min(1, "Dispatch time is at least 1 business day").max(10, "Dispatch time can be up to 10 business days"),
  shipFromSuburb: z.string().trim().min(2, "Enter the suburb you ship from").max(60),
  shipFromState: z.enum(STATES.map((s) => s.code) as [string, ...string[]], { message: "Choose a state" }),
  shipFromPostcode: z.string().trim().regex(/^\d{4}$/, "Postcode: 4 digits"),
  abn: z.string().trim().refine(validAbn, "That isn't a valid ABN"),
  legalName: z.string().trim().max(120),
  gstRegistered: z.enum(["yes", "no"]),
});

export async function updateSellerProfile(_: PortalState, form: FormData): Promise<PortalState> {
  const me = await requireSeller();
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const before = await prisma.seller.findUniqueOrThrow({ where: { id: me.seller.id } });
  const gstRegistered = d.gstRegistered === "yes";

  await prisma.seller.update({
    where: { id: me.seller.id },
    data: {
      name: d.name,
      bio: d.bio,
      phone: d.phone || null,
      website: d.website || null,
      instagram: d.instagram || null,
      dispatchDays: d.dispatchDays,
      shipFromSuburb: d.shipFromSuburb,
      shipFromState: d.shipFromState,
      shipFromPostcode: d.shipFromPostcode,
      abn: formatAbn(d.abn),
      legalName: d.legalName || null,
      gstRegistered,
    },
  });
  // Tax details decide what goes on customers' invoices, so staff should know
  const taxChanged = before.gstRegistered !== gstRegistered || before.abn !== formatAbn(d.abn);
  await log(me, "seller.profile", me.seller.name, {
    href: `/admin/sellers/${me.seller.id}`,
    detail: taxChanged ? `Changed tax details: ABN ${formatAbn(d.abn)}, ${gstRegistered ? "GST registered" : "not GST registered"}` : "Updated their profile",
  });
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

export async function updateBankDetails(_: PortalState, form: FormData): Promise<PortalState> {
  const me = await requireSeller();
  if (await rateLimited("seller-bank", 5, 60 * 60_000)) return { error: "Too many attempts. Try again later." };

  const accountName = String(form.get("accountName") ?? "").trim();
  const bsb = String(form.get("bsb") ?? "").replace(/[\s-]/g, "");
  const account = String(form.get("account") ?? "").replace(/\s/g, "");
  const password = String(form.get("password") ?? "");
  if (accountName.length < 2) return { error: "Enter the account name." };
  if (!/^\d{6}$/.test(bsb)) return { error: "A BSB is 6 digits." };
  if (!/^\d{5,10}$/.test(account)) return { error: "An account number is 5 to 10 digits." };
  // Where the money goes is the most sensitive thing here: confirm it's really them
  const row = await prisma.sellerUser.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(password, row.passwordHash))) return { error: "Your password isn't right." };

  await prisma.seller.update({
    where: { id: me.seller.id },
    data: { bankAccountName: accountName, bankDetailsEnc: seal({ bsb, account }), bankLast4: account.slice(-4) },
  });
  await log(me, "seller.bank", me.seller.name, { href: `/admin/sellers/${me.seller.id}`, detail: `Bank account changed to one ending ${account.slice(-4)}` });
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: me.seller.id }, select: { email: true } });
  await sendBankDetailsChanged(seller.email, me.seller.name);
  revalidatePath("/seller", "layout");
  return { ok: `Saved. Payments will go to the account ending ${account.slice(-4)}.` };
}

// ── Products ─────────────────────────────────────────────────────────────────

async function ownProduct(sellerId: string, productId: string) {
  const p = await prisma.product.findFirst({ where: { id: productId, sellerId } });
  if (!p) redirect("/seller/products");
  return p;
}

/**
 * Seller product save. New and not-yet-approved products are saved as they
 * are and (re)submitted for review. For approved products, prices, stock,
 * options and visibility apply at once; changes to the description and other
 * content are held in pendingChanges until staff approve them.
 */
export async function sellerSaveProduct(_: SaveState, form: FormData): Promise<SaveState> {
  const me = await requireSeller();
  const parsed = parseProductPayload(form);
  if (!parsed.ok) return parsed.state;
  // Sellers can't set the web address or the shop's own labels, so those are ignored
  const { id, variants, active, ...d } = parsed.data;
  const next: ProductContent = {
    name: d.name,
    tagline: d.tagline,
    description: d.description,
    details: d.details,
    specs: d.specs,
    material: d.material,
    care: d.care,
    category: d.category,
    collection: d.collection,
    monogramable: d.monogramable,
  };

  let productId: string;
  let outcome: "new" | "resubmitted" | "pending" | "saved";
  let warning = "";
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (!id) {
        const product = await tx.product.create({
          data: {
            ...next,
            details: JSON.stringify(next.details),
            specs: JSON.stringify(next.specs),
            slug: await uniqueProductSlug(tx, next.name, me.seller.slug),
            sellerId: me.seller.id,
            active,
            reviewStatus: "pending",
            submittedAt: new Date(),
            fromSeed: false,
          },
        });
        warning = await saveVariants(tx, product, variants);
        return { id: product.id, outcome: "new" as const };
      }

      const live = await tx.product.findFirst({ where: { id, sellerId: me.seller.id } });
      if (!live) throw new Error("Not your product");
      warning = await saveVariants(tx, live, variants);

      if (live.reviewStatus !== "approved") {
        // Never been live: save everything and send it (back) for review
        await tx.product.update({
          where: { id },
          data: { ...contentData(next), active, reviewStatus: "pending", reviewNote: null, submittedAt: new Date(), pendingChanges: null },
        });
        return { id, outcome: "resubmitted" as const };
      }

      const changes = diffContent(contentOf(live), next);
      const hasChanges = Object.keys(changes).length > 0;
      await tx.product.update({
        where: { id },
        data: {
          active,
          pendingChanges: hasChanges ? JSON.stringify(changes) : null,
          ...(hasChanges ? { submittedAt: new Date(), reviewNote: null } : {}),
        },
      });
      return { id, outcome: hasChanges ? ("pending" as const) : ("saved" as const) };
    });
    productId = result.id;
    outcome = result.outcome;
  } catch (e) {
    if (isDuplicateSku(e)) return DUPLICATE_SKU;
    throw e;
  }

  if (outcome !== "saved") {
    await log(me, outcome === "new" ? "seller.product.submit" : "seller.product.change", next.name, {
      href: `/admin/approvals/${productId}`,
      detail: outcome === "new" ? "New product for review" : outcome === "resubmitted" ? "Resubmitted for review" : "Changes for review",
    });
  }
  revalidatePath("/", "layout");
  const qs = new URLSearchParams({ saved: outcome });
  if (warning) qs.set("note", warning);
  redirect(`/seller/products/${productId}?${qs}`);
}

export async function sellerDeleteProduct(form: FormData) {
  const me = await requireSeller();
  const product = await ownProduct(me.seller.id, String(form.get("id")));
  const full = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true, _count: { select: { orderItems: true } } } });
  if (full._count.orderItems > 0) {
    await prisma.product.update({ where: { id: product.id }, data: { active: false } });
    redirect(`/seller/products/${product.id}?note=${encodeURIComponent("This product has orders, so it was hidden from the shop instead of deleted.")}`);
  }
  await prisma.product.delete({ where: { id: product.id } });
  await Promise.all(full.images.map((i) => deleteUpload(i.url)));
  await log(me, "seller.product.delete", product.name);
  revalidatePath("/", "layout");
  redirect(`/seller/products?deleted=${encodeURIComponent(product.name)}`);
}

async function ownImage(sellerId: string, imageId: string) {
  const img = await prisma.productImage.findFirst({ where: { id: imageId, product: { sellerId } }, include: { product: { select: { slug: true } } } });
  if (!img) redirect("/seller/products");
  return img;
}

export async function sellerUpdateImage(form: FormData) {
  const me = await requireSeller();
  const img = await ownImage(me.seller.id, String(form.get("id")));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const colourName = String(form.get("colourName") ?? "").trim() || null;
  await prisma.productImage.update({ where: { id: img.id }, data: { ...(alt ? { alt } : {}), colourName } });
  revalidatePath(`/products/${img.product.slug}`);
  revalidatePath(`/seller/products/${img.productId}`);
}

export async function sellerMoveImage(form: FormData) {
  const me = await requireSeller();
  const img = await ownImage(me.seller.id, String(form.get("id")));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const i = all.findIndex((a) => a.id === img.id);
  const j = i + dir;
  if (j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await prisma.$transaction(all.map((a, k) => prisma.productImage.update({ where: { id: a.id }, data: { sortOrder: k } })));
  revalidatePath(`/products/${img.product.slug}`);
  revalidatePath(`/seller/products/${img.productId}`);
}

export async function sellerDeleteImage(form: FormData) {
  const me = await requireSeller();
  const img = await ownImage(me.seller.id, String(form.get("id")));
  await prisma.productImage.delete({ where: { id: img.id } });
  await deleteUpload(img.url);
  revalidatePath(`/products/${img.product.slug}`);
  revalidatePath(`/seller/products/${img.productId}`);
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function sellerUpdateShipment(form: FormData) {
  const me = await requireSeller();
  const id = String(form.get("id"));
  const shipment = await prisma.shipment.findFirst({ where: { id, sellerId: me.seller.id }, include: { order: { select: { number: true } } } });
  if (!shipment) redirect("/seller/orders");
  const detail = await updateShipment(
    id,
    {
      status: String(form.get("status")),
      carrier: String(form.get("carrier") ?? ""),
      trackingNumber: String(form.get("trackingNumber") ?? ""),
      notify: form.get("notify") === "on",
    },
    { allowCancel: false }
  );
  if (detail) await log(me, "seller.shipment", `Order #${shipment.order.number}`, { href: `/admin/orders/${shipment.order.number}`, detail });
  revalidatePath("/seller", "layout");
}
