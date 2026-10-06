"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { sendPayoutRemittance } from "@/lib/email";
import { balanceFor } from "@/lib/marketplace";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { open } from "@/lib/secretbox";

export type PayoutState = { error?: string; ok?: string } | null;

const cents = (input: FormDataEntryValue | null) => {
  const n = Number(String(input ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

/**
 * Records a bank transfer you've made to a seller. It's capped at what's
 * payable now (sales past the hold period), so held money can't go out early.
 */
export async function recordPayout(_: PayoutState, form: FormData): Promise<PayoutState> {
  const staff = await requireStaff("payouts");
  const sellerId = String(form.get("sellerId"));
  const amount = cents(form.get("amount"));
  const reference = String(form.get("reference") ?? "").trim().slice(0, 80) || null;
  const paidAt = new Date(String(form.get("paidAt") ?? ""));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter the amount you transferred." };
  if (Number.isNaN(paidAt.getTime())) return { error: "Enter the date you made the transfer." };

  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: sellerId } });
  const { available } = await balanceFor(sellerId);
  if (amount > available) return { error: `Only ${formatMoney(available)} is payable now. The rest is still in the hold period.` };

  await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({ data: { sellerId, amountCents: amount, reference, paidAt, createdByName: staff.name } });
    await tx.ledgerEntry.create({
      data: {
        sellerId,
        type: "PAYOUT",
        amountCents: -amount,
        description: `Bank transfer${reference ? ` (ref ${reference})` : ""}`,
        payoutId: payout.id,
        availableAt: new Date(),
      },
    });
  });
  await sendPayoutRemittance(seller.email, { sellerName: seller.name, amountCents: amount, reference, paidAt, account: seller.bankLast4 });
  await audit(staff, "payout.record", seller.name, { href: "/admin/payouts", detail: `${formatMoney(amount)}${reference ? `, ref ${reference}` : ""}` });
  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/sellers/${sellerId}`);
  return { ok: `Recorded ${formatMoney(amount)} paid to ${seller.name}. They've been emailed a remittance.` };
}

/** A manual credit or debit, e.g. a partial refund or a postage reimbursement. */
export async function adjustBalance(_: PayoutState, form: FormData): Promise<PayoutState> {
  const staff = await requireStaff("payouts");
  const sellerId = String(form.get("sellerId"));
  const amount = cents(form.get("amount"));
  const description = String(form.get("description") ?? "").trim().slice(0, 200);
  if (!Number.isFinite(amount) || amount === 0) return { error: "Enter an amount. Use a minus sign to deduct." };
  if (description.length < 3) return { error: "Say what the adjustment is for. The seller sees this." };
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: sellerId }, select: { name: true } });
  await prisma.ledgerEntry.create({ data: { sellerId, type: "ADJUSTMENT", amountCents: amount, description, availableAt: new Date() } });
  await audit(staff, "payout.adjust", seller.name, { href: `/admin/sellers/${sellerId}`, detail: `${amount < 0 ? "−" : "+"}${formatMoney(Math.abs(amount))}: ${description}` });
  revalidatePath(`/admin/sellers/${sellerId}`);
  revalidatePath("/admin/payouts");
  return { ok: "Adjustment added to their statement." };
}

/** Shows a seller's full bank details to the owner. Every look is logged. */
export async function revealBankDetails(sellerId: string) {
  const staff = await requireStaff("payouts");
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: sellerId } });
  const details = open<{ bsb: string; account: string }>(seller.bankDetailsEnc);
  await audit(staff, "payout.bank", seller.name, { href: `/admin/sellers/${sellerId}`, detail: "Viewed bank details" });
  if (!details) return null;
  return { accountName: seller.bankAccountName ?? "", bsb: `${details.bsb.slice(0, 3)}-${details.bsb.slice(3)}`, account: details.account };
}
