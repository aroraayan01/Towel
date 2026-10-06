"use server";

import { z } from "zod";

import { CATEGORY_ORDER } from "@/lib/collections";
import { sendApplicationReceived, sendNewApplicationAlert } from "@/lib/email";
import { formatAbn, uniqueSellerSlug, validAbn } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { STATES } from "@/lib/shipping";
import { store } from "@/lib/store";

/** values: what was typed, sent back so the form can be refilled after an error (React resets forms). */
export type ApplyState = { ok: boolean; message: string; errors?: Record<string, string>; values?: Record<string, string | string[]> } | null;

const optionalUrl = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.string().url("Enter a web address, e.g. yourshop.com.au")]));

const schema = z.object({
  name: z.string().trim().min(2, "Enter your business or brand name").max(80),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z.string().trim().max(20).regex(/^[0-9 +()-]*$/, "Numbers only"),
  abn: z.string().trim().refine(validAbn, "That isn't a valid ABN. It's the 11-digit number on the ABN Lookup site."),
  legalName: z.string().trim().max(120),
  gstRegistered: z.enum(["yes", "no"], { message: "Tell us whether you're registered for GST" }),
  website: optionalUrl,
  instagram: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "")),
  categories: z.array(z.enum(CATEGORY_ORDER as [string, ...string[]])).min(1, "Choose at least one category"),
  application: z.string().trim().min(60, "Tell us a bit more: what you make, what it's made from, and your price range").max(3000),
  shipFromSuburb: z.string().trim().min(2, "Where do you ship from?").max(60),
  shipFromState: z.enum(STATES.map((s) => s.code) as [string, ...string[]], { message: "Choose a state" }),
  shipFromPostcode: z.string().trim().regex(/^\d{4}$/, "4-digit postcode"),
  agree: z.literal("on", { message: "Please read and accept the seller terms" }),
});

export async function applyToSell(prev: ApplyState, form: FormData): Promise<ApplyState> {
  const values: Record<string, string | string[]> = { categories: form.getAll("categories").map(String) };
  for (const [k, v] of form) if (k !== "categories" && k !== "fax" && typeof v === "string") values[k] = v;
  const result = await apply(form);
  return result.ok ? result : { ...result, values };
}

async function apply(form: FormData): Promise<NonNullable<ApplyState>> {
  if (form.get("fax")) return { ok: true, message: "Thanks!" }; // honeypot
  if (await rateLimited("sell-apply", 3, 60 * 60_000)) return { ok: false, message: "You've sent a few applications already. We'll be in touch." };

  const parsed = schema.safeParse({
    ...Object.fromEntries(["name", "contactName", "email", "phone", "abn", "legalName", "gstRegistered", "website", "instagram", "application", "shipFromSuburb", "shipFromState", "shipFromPostcode", "agree"].map((k) => [k, form.get(k) ?? ""])),
    categories: form.getAll("categories"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }
  const d = parsed.data;

  const existing = await prisma.seller.findUnique({ where: { email: d.email }, select: { status: true } });
  if (existing) {
    return {
      ok: false,
      message:
        existing.status === "pending"
          ? "We already have an application from this email and will reply soon."
          : `This email is already linked to a seller account. Email ${store.email} if you need help.`,
      errors: { email: "Already used" },
    };
  }

  const seller = await prisma.seller.create({
    data: {
      slug: await uniqueSellerSlug(d.name),
      name: d.name,
      contactName: d.contactName,
      email: d.email,
      phone: d.phone || null,
      abn: formatAbn(d.abn),
      legalName: d.legalName || null,
      gstRegistered: d.gstRegistered === "yes",
      website: d.website || null,
      instagram: d.instagram || null,
      categories: JSON.stringify(d.categories),
      application: d.application,
      shipFromSuburb: d.shipFromSuburb,
      shipFromState: d.shipFromState,
      shipFromPostcode: d.shipFromPostcode,
      commissionBps: store.marketplace.defaultCommissionBps,
      agreedTermsAt: new Date(),
    },
  });

  await sendApplicationReceived(seller.email, seller.contactName);
  await sendNewApplicationAlert(seller);
  return { ok: true, message: `Thanks, ${seller.contactName.split(" ")[0]}. We've got your application and usually reply within a week.` };
}
