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


const button = (href: string, label: string) =>
  `<p style="line-height:1.6;margin:0 0 20px"><a href="${href}" style="display:inline-block;background:#1d4d3f;color:#fff;padding:13px 24px;text-decoration:none;font-size:13px;letter-spacing:.06em;text-transform:uppercase">${label}</a></p>`;
const p = (html: string) => `<p style="line-height:1.6;margin:0 0 14px">${html}</p>`;

// ── Customer orders ──────────────────────────────────────────────────────────

type EmailSupplier = { name: string; legalName: string | null; abn: string | null; gstRegistered: boolean } | null;

export type OrderForEmail = {
  number: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  suburb: string;
  state: string;
  postcode: string;
  subtotalCents: number;
  discountCents: number;
  discountCode: string | null;
  giftWrapCents: number;
  totalCents: number;
  gstCents: number;
  giftMessage: string | null;
  createdAt: Date;
  items: {
    name: string;
    variantLabel: string;
    quantity: number;
    unitCents: number;
    monogram: string | null;
    monogramCents: number;
    gstCents: number;
    shipmentId: string | null;
  }[];
  shipments: { id: string; sellerId: string | null; shippingCents: number; shippingGstCents: number; method: string; seller: EmailSupplier }[];
};

export function orderUrl(o: { number: string; accessToken: string }) {
  return `${store.url}/order/${o.number}?t=${o.accessToken}`;
}

/** The supplier named on the tax invoice for a shipment: the seller, or the shop itself. */
export function supplierLine(s: EmailSupplier) {
  if (!s) return `${store.legalName} · ABN ${store.abn}${store.gstRegistered ? "" : " · not registered for GST"}`;
  const who = s.legalName && s.legalName !== s.name ? `${s.name} (${s.legalName})` : s.name;
  return `${who}${s.abn ? ` · ABN ${s.abn}` : ""}${s.gstRegistered ? "" : " · not registered for GST, no GST charged"}`;
}

const address = (o: OrderForEmail) =>
  `${esc(o.firstName)} ${esc(o.lastName)}<br>${esc(o.address1)}${o.address2 ? `<br>${esc(o.address2)}` : ""}<br>${esc(o.suburb)} ${esc(o.state)} ${esc(o.postcode)}`;

/**
 * Order confirmation, doubling as the tax invoice. Items are grouped by who
 * ships them, each with that supplier's ABN and GST, because marketplace
 * sellers are the suppliers of their own goods.
 */
export async function sendOrderConfirmation(o: OrderForEmail) {
  const multi = o.shipments.length > 1;
  const itemRow = (i: OrderForEmail["items"][number]) => {
    const unit = i.unitCents + i.monogramCents;
    return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee">${esc(i.name)}<br><span style="color:#6e645b;font-size:13px">${esc(i.variantLabel)}${i.monogram ? ` · Monogram: ${esc(i.monogram)}` : ""} · Qty ${i.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatMoney(unit * i.quantity)}</td></tr>`;
  };
  const line = (label: string, cents: number, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold;font-size:16px" : "color:#6e645b"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;font-size:16px" : ""}">${formatMoney(cents)}</td></tr>`;

  const groups = o.shipments
    .map((s) => {
      const items = o.items.filter((i) => i.shipmentId === s.id);
      const gst = items.reduce((n, i) => n + i.gstCents, 0) + s.shippingGstCents;
      const heading = multi
        ? `<p style="margin:18px 0 2px;font-weight:bold">${s.seller ? `Sold and shipped by ${esc(s.seller.name)}` : `Shipped by ${esc(store.name)}`}</p>`
        : "";
      return `${heading}
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${items.map(itemRow).join("")}
<tr><td style="padding:8px 0;color:#6e645b">${esc(s.method)}</td><td style="padding:8px 0;text-align:right">${s.shippingCents ? formatMoney(s.shippingCents) : "Free"}</td></tr></table>
<p style="margin:2px 0 0;font-size:12px;color:#6e645b">Supplier: ${esc(supplierLine(s.seller))}${gst ? ` · GST included ${formatMoney(gst)}` : ""}</p>`;
    })
    .join("");

  const intro = multi
    ? `Order <strong>#${o.number}</strong> is confirmed. It's coming in ${o.shipments.length} parcels from different makers, and we'll email tracking details as each one ships.`
    : `Order <strong>#${o.number}</strong> is confirmed. We'll email you tracking details when it ships, usually within 1 to 2 business days.`;

  const html = layout(
    `Thanks for your order, ${esc(o.firstName)}`,
    `${p(intro)}
${button(orderUrl(o), "View your order")}
<p style="font-size:13px;color:#6e645b;margin:0 0 8px"><strong>Tax invoice</strong> · ${o.createdAt.toLocaleDateString("en-AU", { dateStyle: "long" })}</p>
${groups}
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;border-top:1px solid #eee;padding-top:8px">
${line("Subtotal", o.subtotalCents)}
${o.discountCents ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, -o.discountCents) : ""}
${o.giftWrapCents ? line("Gift wrapping", o.giftWrapCents) : ""}
${line("Delivery", o.shipments.reduce((n, s) => n + s.shippingCents, 0))}
${line("Total (AUD)", o.totalCents, true)}
<tr><td style="padding:4px 0;color:#6e645b;font-size:12px">Includes GST of</td><td style="padding:4px 0;text-align:right;font-size:12px;color:#6e645b">${formatMoney(o.gstCents)}</td></tr>
</table>
<p style="margin:20px 0 4px;font-weight:bold">Shipping to</p>
<p style="margin:0;line-height:1.5;color:#463f39">${address(o)}</p>
${o.giftMessage ? `<p style="margin:20px 0 4px;font-weight:bold">Gift note</p><p style="margin:0;color:#463f39">“${esc(o.giftMessage)}”</p>` : ""}
<p style="margin:28px 0 0;line-height:1.6;border-top:1px solid #eee;padding-top:18px;color:#6b6966;font-size:13px">Questions? Reply to this email and we'll get back to you within one business day.</p>`
  );

  const text = [
    `Thanks ${o.firstName}, order #${o.number} is confirmed.`,
    ...o.shipments.flatMap((s) => [
      ...(multi ? [`${s.seller ? `Sold and shipped by ${s.seller.name}` : `Shipped by ${store.name}`}:`] : []),
      ...o.items
        .filter((i) => i.shipmentId === s.id)
        .map((i) => `- ${i.name} (${i.variantLabel}${i.monogram ? `, monogram ${i.monogram}` : ""}) x${i.quantity}: ${formatMoney((i.unitCents + i.monogramCents) * i.quantity)}`),
      `  ${s.method}: ${s.shippingCents ? formatMoney(s.shippingCents) : "Free"} (supplier: ${supplierLine(s.seller)})`,
    ]),
    `Total: ${formatMoney(o.totalCents)} (incl. GST ${formatMoney(o.gstCents)})`,
    `View your order: ${orderUrl(o)}`,
  ].join("\n");

  await sendMail({ to: o.email, subject: `Order #${o.number} confirmed`, html, text });
  const senders = o.shipments.map((s) => esc(s.seller?.name ?? store.name)).join(", ");
  await sendMail({
    to: adminEmail(),
    subject: `New order #${o.number}: ${formatMoney(o.totalCents)}`,
    html: layout(
      `New order #${o.number}`,
      `${p(`${esc(o.firstName)} ${esc(o.lastName)} (${esc(o.email)}) · ${formatMoney(o.totalCents)}`)}${multi ? p(`${o.shipments.length} shipments: ${senders}`) : ""}${p(`<a href="${store.url}/admin/orders/${o.number}">Open in admin</a>`)}`
    ),
    text: `New order ${o.number} from ${o.email}: ${formatMoney(o.totalCents)}`,
  });
}

/** Tells the customer one shipment is on its way. */
export async function sendShipmentEmail(
  o: { number: string; accessToken: string; firstName: string; email: string },
  s: { carrier: string | null; trackingNumber: string | null; trackUrl: string | null; senderName: string; items: string[]; partOfMany: boolean }
) {
  const carrier = s.carrier && s.carrier !== "Other" ? `${esc(s.carrier)} tracking` : "Tracking";
  const tracking = s.trackingNumber
    ? p(`${carrier} number: <strong>${esc(s.trackingNumber)}</strong>.${s.trackUrl ? ` <a href="${s.trackUrl}" style="color:#141414">Track your parcel</a>.` : ""}`)
    : "";
  const what = s.partOfMany ? `Part of order <strong>#${o.number}</strong>, from ${esc(s.senderName)},` : `Order <strong>#${o.number}</strong>`;
  await sendMail({
    to: o.email,
    subject: s.partOfMany ? `Part of order #${o.number} has shipped` : `Order #${o.number} has shipped`,
    html: layout(
      s.partOfMany ? "Part of your order has shipped" : "Your order has shipped",
      `${p(`${what} is on its way.`)}${s.partOfMany ? p(s.items.map(esc).join("<br>")) : ""}${tracking}${p(`<a href="${orderUrl(o)}" style="color:#141414">View your order</a>`)}`
    ),
    text: `${s.partOfMany ? `Part of order ${o.number} (from ${s.senderName})` : `Order ${o.number}`} has shipped.${s.trackingNumber ? ` Tracking: ${s.trackingNumber}` : ""}${s.trackUrl ? ` ${s.trackUrl}` : ""} ${orderUrl(o)}`,
  });
}

// ── Sellers ──────────────────────────────────────────────────────────────────

const portal = (path = "") => `${store.url}/seller${path}`;

/** A seller has a new paid order to ship. */
export async function sendSellerNewOrder(
  to: string,
  d: { sellerName: string; orderNumber: string; shipmentId: string; items: string[]; shipTo: string; giftMessage: string | null; dispatchDays: number }
) {
  const days = `${d.dispatchDays} business day${d.dispatchDays === 1 ? "" : "s"}`;
  await sendMail({
    to,
    subject: `New order to ship: #${d.orderNumber}`,
    html: layout(
      `New order #${d.orderNumber}`,
      `${p(`You have a new order to ship, ${esc(d.sellerName)}. Please send it within ${days} and add the tracking number in your seller portal.`)}
${p(d.items.map(esc).join("<br>"))}
${p(`<strong>Ship to</strong><br>${esc(d.shipTo).replace(/\n/g, "<br>")}`)}
${d.giftMessage ? p(`<strong>Gift note to include</strong><br>“${esc(d.giftMessage)}”`) : ""}
${button(portal(`/orders/${d.shipmentId}`), "Open the order")}`
    ),
    text: `New order #${d.orderNumber} to ship within ${days}:\n${d.items.join("\n")}\nShip to:\n${d.shipTo}${d.giftMessage ? `\nGift note: ${d.giftMessage}` : ""}\n${portal(`/orders/${d.shipmentId}`)}`,
  });
}

export async function sendApplicationReceived(to: string, name: string) {
  await sendMail({
    to,
    subject: `We've got your application to sell on ${store.name}`,
    html: layout(
      `Thanks, ${esc(name.split(" ")[0])}`,
      `${p(`We've received your application to sell on ${esc(store.name)}. We look at every one ourselves and usually reply within a week.`)}${p("If you're approved, you'll get an email with your login to the seller portal.")}`
    ),
    text: `We've received your application to sell on ${store.name} and usually reply within a week.`,
  });
}

export async function sendNewApplicationAlert(d: { name: string; contactName: string; email: string; id: string }) {
  await sendMail({
    to: adminEmail(),
    subject: `New seller application: ${d.name}`,
    html: layout(
      "New seller application",
      `${p(`${esc(d.name)} (${esc(d.contactName)}, ${esc(d.email)}) has applied to sell.`)}${p(`<a href="${store.url}/admin/sellers/${d.id}">Review it in admin</a>`)}`
    ),
    text: `New seller application from ${d.name} (${d.email}): ${store.url}/admin/sellers/${d.id}`,
  });
}

/** Approval, with a temporary password (also shown to staff, in case email isn't set up). */
export async function sendSellerApproved(to: string, d: { name: string; contactName: string; password: string; commission: string }) {
  await sendMail({
    to,
    subject: `You're approved to sell on ${store.name}`,
    html: layout(
      `Welcome, ${esc(d.contactName.split(" ")[0])}`,
      `${p(`${esc(d.name)} is approved to sell on ${esc(store.name)}. Your commission rate is ${esc(d.commission)} of each sale.`)}
${p(`Log in with this email and the temporary password <strong style="font-family:monospace">${esc(d.password)}</strong>. You'll choose your own password straight away.`)}
${button(portal("/login"), "Log in to the seller portal")}
${p("Next steps: add your bank details and ship-from address in Profile, then add your first products. Each product is checked by us before it goes live.")}`
    ),
    text: `${d.name} is approved to sell on ${store.name}. Commission: ${d.commission}. Log in at ${portal("/login")} with ${to} and the temporary password ${d.password}.`,
  });
}

export async function sendSellerDecision(to: string, d: { contactName: string; title: string; message: string; note?: string | null }) {
  await sendMail({
    to,
    subject: d.title,
    html: layout(esc(d.title), `${p(`Hi ${esc(d.contactName.split(" ")[0])},`)}${p(esc(d.message))}${d.note ? p(`<em>${esc(d.note)}</em>`) : ""}${p("Questions? Reply to this email.")}`),
    text: `Hi ${d.contactName.split(" ")[0]},\n${d.message}${d.note ? `\n\n${d.note}` : ""}`,
  });
}

export async function sendListingDecision(to: string, d: { productName: string; productId: string; approved: boolean; changes: boolean; note?: string | null }) {
  const what = d.changes ? `Your changes to ${d.productName}` : d.productName;
  const title = d.approved ? `${what} ${d.changes ? "are" : "is"} live` : `${what} need${d.changes ? "" : "s"} changes`;
  const body = d.approved
    ? d.changes
      ? "We've approved your changes and they're now showing in the shop."
      : "We've approved your product and it's now live in the shop."
    : d.changes
      ? "We couldn't approve these changes, so the shop is still showing the previous version."
      : "We couldn't approve this product yet.";
  await sendMail({
    to,
    subject: title,
    html: layout(esc(title), `${p(body)}${d.note ? p(`<strong>Our note:</strong> ${esc(d.note)}`) : ""}${button(portal(`/products/${d.productId}`), "Open the product")}`),
    text: `${title}.${d.note ? ` Note: ${d.note}` : ""} ${portal(`/products/${d.productId}`)}`,
  });
}

export async function sendPayoutRemittance(to: string, d: { sellerName: string; amountCents: number; reference: string | null; paidAt: Date; account: string | null }) {
  const when = d.paidAt.toLocaleDateString("en-AU", { dateStyle: "long" });
  await sendMail({
    to,
    subject: `Payment sent: ${formatMoney(d.amountCents)}`,
    html: layout(
      "Payment sent",
      `${p(`We've paid ${esc(d.sellerName)} <strong>${formatMoney(d.amountCents)}</strong> by bank transfer on ${when}${d.account ? ` to the account ending ${esc(d.account)}` : ""}.`)}${d.reference ? p(`Reference: ${esc(d.reference)}`) : ""}${p("It can take 1 to 2 business days to appear. Your full statement is in the seller portal.")}${button(portal("/payouts"), "View statement")}`
    ),
    text: `We've paid ${d.sellerName} ${formatMoney(d.amountCents)} on ${when}.${d.reference ? ` Reference: ${d.reference}.` : ""} ${portal("/payouts")}`,
  });
}

/** A seller changed where their money goes: tell them, in case it wasn't them. */
export async function sendBankDetailsChanged(to: string, sellerName: string) {
  await sendMail({
    to,
    subject: "Your payout bank details were changed",
    html: layout(
      "Bank details changed",
      `${p(`The bank account for payments to ${esc(sellerName)} was just changed in the seller portal.`)}${p("<strong>If this wasn't you, reply to this email straight away</strong> so we can hold payments.")}`
    ),
    text: `The bank account for payments to ${sellerName} was just changed. If this wasn't you, reply straight away.`,
  });
  await sendMail({
    to: adminEmail(),
    subject: `Seller bank details changed: ${sellerName}`,
    html: layout("Seller bank details changed", p(`${esc(sellerName)} changed their payout bank details. Check before the next payout.`)),
    text: `${sellerName} changed their payout bank details.`,
  });
}

export { esc as escapeHtml, layout as emailLayout };
