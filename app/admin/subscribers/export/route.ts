import { staffFor } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await staffFor("subscribers");
  if (!staff) return new Response("Unauthorised", { status: 401 });
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  // A copy of customers' email addresses leaving the system is worth a record
  await audit(staff, "subscribers.export", `${subs.length} email addresses`);
  const csv = ["email,joined", ...subs.map((s) => `"${s.email.replace(/"/g, '""')}",${s.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
