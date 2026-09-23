"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminEmail, escapeHtml, emailLayout, sendMail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    out[k] ??= issue.message;
  }
  return out;
}

const email = z.string().trim().toLowerCase().email("Please enter a valid email address").max(200);

// ─── Newsletter ──────────────────────────────────────────────────
export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("company")) return { ok: true, message: "Thanks!" }; // honeypot
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (await rateLimited("subscribe", 5, 60_000)) return { ok: false, message: "Too many attempts. Try again in a minute." };

  await prisma.subscriber.upsert({ where: { email: parsed.data }, create: { email: parsed.data }, update: {} });
  return {
    ok: true,
    message: `Thanks for signing up. Use ${store.commerce.welcomeCode} at checkout for 10% off your first order.`,
  };
}

// ─── Contact form ────────────────────────────────────────────────
const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email,
  orderRef: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10, "Please add a bit more detail").max(4000),
});

export async function sendContact(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("company")) return { ok: true, message: "Thanks!" };
  const parsed = contactSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    orderRef: form.get("orderRef") || undefined,
    message: form.get("message"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };
  if (await rateLimited("contact", 3, 10 * 60_000)) return { ok: false, message: "You've already sent a few messages. We'll reply soon." };

  const m = await prisma.contactMessage.create({ data: parsed.data });

  await sendMail({
    to: adminEmail(),
    replyTo: m.email,
    subject: `Website enquiry from ${m.name}${m.orderRef ? ` (order ${m.orderRef})` : ""}`,
    html: emailLayout("New enquiry", `<p><strong>${escapeHtml(m.name)}</strong> &lt;${escapeHtml(m.email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`),
    text: `${m.name} <${m.email}>\n\n${m.message}`,
  });
  await sendMail({
    to: m.email,
    subject: `We've received your message`,
    html: emailLayout(
      `Thanks, ${escapeHtml(m.name.split(" ")[0])}`,
      `<p style="line-height:1.6">We've received your message and will reply within one business day (${escapeHtml(store.hours)}).</p>`
    ),
    text: `Thanks for getting in touch. We'll reply within one business day.`,
  });

  return { ok: true, message: "We'll reply within one business day." };
}

// ─── Reviews ─────────────────────────────────────────────────────
const reviewSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(1, "Enter your first name").max(60),
  location: z.string().trim().max(60).optional(),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().min(2, "Add a title").max(100),
  body: z.string().trim().min(10, "Please write at least a sentence").max(2000),
});

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("company")) return { ok: true, message: "Thanks!" };
  const parsed = reviewSchema.safeParse({
    productId: form.get("productId"),
    name: form.get("name"),
    location: form.get("location") || undefined,
    rating: form.get("rating") ?? 0,
    title: form.get("title"),
    body: form.get("body"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };
  if (await rateLimited("review", 3, 60 * 60_000)) return { ok: false, message: "You've left several reviews recently. Please try again later." };

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { slug: true } });
  if (!product) return { ok: false, message: "That product no longer exists." };

  await prisma.review.create({ data: { ...parsed.data, approved: false } });
  revalidatePath("/admin/reviews");
  return { ok: true, message: "Thanks for your review. It will appear once we've checked it, usually within a day." };
}
