import "server-only";

import nodemailer from "nodemailer";

import { formatMoney } from "./money";
import { store } from "./store";

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

/**
 * Sends an email, or prints it to the console when SMTP isn't configured.
 * Never throws — a mail outage must not fail a paid order.
 */
export async function sendMail(mail: Mail) {
  const t = getTransport();
  if (!t) {
    console.info(`\n[email:not-sent — SMTP_HOST unset] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? `${store.name} <${store.email}>`,
      ...mail,
    });
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

export const adminEmail = () => process.env.MAIL_ADMIN ?? store.email;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f1ed;font-family:Helvetica,Arial,sans-serif;color:#2b2622">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ed;padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;overflow:hidden">
<tr><td style="background:#1d4d3f;color:#fff;padding:18px 28px;font-size:18px;letter-spacing:.18em;text-transform:uppercase">
<img src="${store.url}/apple-icon" width="30" height="30" alt="" style="vertical-align:middle;margin-right:12px;border:1px solid rgba(255,255,255,.25)">${esc(store.name)}</td></tr>
<tr><td style="padding:28px">
<h1 style="font-weight:500;font-size:22px;margin:0 0 16px">${title}</h1>
${body}
</td></tr>
<tr><td style="background:#f3f1ed;padding:18px 28px;font-size:12px;color:#6b6966;line-height:1.6">
${esc(store.legalName)} · ABN ${esc(store.abn)}<br>
${esc(store.address.street)}, ${esc(store.address.suburb)} ${esc(store.address.state)} ${esc(store.address.postcode)}<br>
<a href="${store.url}" style="color:#141414">${store.url.replace(/^https?:\/\//, "")}</a> · ${esc(store.email)}
</td></tr></table></td></tr></table></body></html>`;
}

type OrderForEmail = {
  number: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  address2: string | null;
  suburb: string;
  state: string;
  postcode: string;
  shippingMethod: string;
  shippingCents: number;
  subtotalCents: number;
  discountCents: number;
  discountCode: string | null;
  giftWrapCents: number;
  totalCents: number;
  gstCents: number;
  giftMessage: string | null;
  createdAt: Date;
  items: { name: string; variantLabel: string; quantity: number; unitCents: number; monogram: string | null; monogramCents: number }[];
};

export function orderUrl(o: { number: string; accessToken: string }) {
  return `${store.url}/order/${o.number}?t=${o.accessToken}`;
}

/** Order confirmation doubling as a tax invoice (ABN, GST shown). */
export async function sendOrderConfirmation(o: OrderForEmail) {
  const rows = o.items
    .map((i) => {
      const unit = i.unitCents + i.monogramCents;
      return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee">${esc(i.name)}<br><span style="color:#6e645b;font-size:13px">${esc(i.variantLabel)}${i.monogram ? ` · Monogram: ${esc(i.monogram)}` : ""} · Qty ${i.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatMoney(unit * i.quantity)}</td></tr>`;
    })
    .join("");
  const line = (label: string, cents: number, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold;font-size:16px" : "color:#6e645b"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;font-size:16px" : ""}">${formatMoney(cents)}</td></tr>`;

  const html = layout(
    `Thanks for your order, ${esc(o.firstName)}`,
    `<p style="line-height:1.6;margin:0 0 16px">Order <strong>#${o.number}</strong> is confirmed. We'll email you a tracking number when it ships, usually within 1 to 2 business days.</p>
<p style="line-height:1.6;margin:0 0 20px"><a href="${orderUrl(o)}" style="display:inline-block;background:#141414;color:#fff;padding:13px 24px;text-decoration:none;font-size:13px;letter-spacing:.06em;text-transform:uppercase">View your order</a></p>
<p style="font-size:13px;color:#6e645b;margin:0 0 8px"><strong>Tax invoice</strong> · ${o.createdAt.toLocaleDateString("en-AU", { dateStyle: "long" })}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:12px">
${line("Subtotal", o.subtotalCents)}
${o.discountCents ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, -o.discountCents) : ""}
${o.giftWrapCents ? line("Gift wrapping", o.giftWrapCents) : ""}
${line(o.shippingMethod, o.shippingCents)}
${line("Total (AUD)", o.totalCents, true)}
<tr><td style="padding:4px 0;color:#6e645b;font-size:12px">Includes GST of</td><td style="padding:4px 0;text-align:right;font-size:12px;color:#6e645b">${formatMoney(o.gstCents)}</td></tr>
</table>
<p style="margin:20px 0 4px;font-weight:bold">Shipping to</p>
<p style="margin:0;line-height:1.5;color:#463f39">${esc(o.firstName)} ${esc(o.lastName)}<br>${esc(o.address1)}${o.address2 ? `<br>${esc(o.address2)}` : ""}<br>${esc(o.suburb)} ${esc(o.state)} ${esc(o.postcode)}</p>
${o.giftMessage ? `<p style="margin:20px 0 4px;font-weight:bold">Gift note</p><p style="margin:0;color:#463f39">“${esc(o.giftMessage)}”</p>` : ""}
<p style="margin:28px 0 0;line-height:1.6;border-top:1px solid #eee;padding-top:18px;color:#6b6966;font-size:13px">Questions? Reply to this email and we'll get back to you within one business day.</p>`
  );

  const text = [
    `Thanks ${o.firstName}, order #${o.number} is confirmed.`,
    ...o.items.map((i) => `- ${i.name} (${i.variantLabel}${i.monogram ? `, monogram ${i.monogram}` : ""}) x${i.quantity}: ${formatMoney((i.unitCents + i.monogramCents) * i.quantity)}`),
    `Total: ${formatMoney(o.totalCents)} (incl. GST ${formatMoney(o.gstCents)})`,
    `View your order: ${orderUrl(o)}`,
    `${store.legalName} ABN ${store.abn}`,
  ].join("\n");

  await sendMail({ to: o.email, subject: `Order #${o.number} confirmed`, html, text });
  await sendMail({
    to: adminEmail(),
    subject: `New order #${o.number}: ${formatMoney(o.totalCents)}`,
    html: layout(`New order #${o.number}`, `<p>${esc(o.firstName)} ${esc(o.lastName)} (${esc(o.email)}) · ${formatMoney(o.totalCents)}</p><p><a href="${store.url}/admin/orders/${o.number}">Open in admin</a></p>`),
    text: `New order ${o.number} from ${o.email}: ${formatMoney(o.totalCents)}`,
  });
}

export async function sendShippedEmail(o: { number: string; accessToken: string; firstName: string; email: string; trackingNumber: string | null }) {
  const tracking = o.trackingNumber
    ? `<p style="line-height:1.6">Your tracking number is <strong>${esc(o.trackingNumber)}</strong>. <a href="https://auspost.com.au/mypost/track/details/${encodeURIComponent(o.trackingNumber)}" style="color:#141414">Track with Australia Post</a>.</p>`
    : "";
  await sendMail({
    to: o.email,
    subject: `Order #${o.number} has shipped`,
    html: layout(
      `Your order has shipped`,
      `<p style="line-height:1.6">Order <strong>#${o.number}</strong> has left our warehouse.</p>${tracking}<p><a href="${orderUrl(o)}" style="color:#141414">View your order</a></p>`
    ),
    text: `Order ${o.number} has shipped.${o.trackingNumber ? ` Tracking: ${o.trackingNumber}` : ""} ${orderUrl(o)}`,
  });
}

export { esc as escapeHtml, layout as emailLayout };
