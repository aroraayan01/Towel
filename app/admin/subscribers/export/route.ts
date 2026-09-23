import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorised", { status: 401 });
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const csv = ["email,joined", ...subs.map((s) => `"${s.email.replace(/"/g, '""')}",${s.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
