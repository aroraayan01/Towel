import { staffFor } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { balances } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { open } from "@/lib/secretbox";

// The list of sellers to pay right now, with bank details, for entering
// transfers in internet banking. Owner only, and every download is logged.
export async function GET() {
  const staff = await staffFor("payouts");
  if (!staff) return new Response("Unauthorised", { status: 401 });

  const money = await balances();
  const sellers = await prisma.seller.findMany({ where: { id: { in: [...money.keys()] } } });
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = sellers
    .map((s) => ({ s, available: money.get(s.id)?.available ?? 0, bank: open<{ bsb: string; account: string }>(s.bankDetailsEnc) }))
    .filter((r) => r.available > 0)
    .map((r) =>
      [q(r.s.name), q(r.s.bankAccountName ?? ""), q(r.bank ? `${r.bank.bsb.slice(0, 3)}-${r.bank.bsb.slice(3)}` : "MISSING"), q(r.bank?.account ?? "MISSING"), (r.available / 100).toFixed(2), q(`XOMEXO ${r.s.slug}`.slice(0, 18).toUpperCase())].join(",")
    );

  await audit(staff, "payout.export", `${rows.length} sellers`, { href: "/admin/payouts", detail: "Downloaded the payment list with bank details" });
  return new Response(["seller,account_name,bsb,account_number,amount,reference", ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="seller-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
