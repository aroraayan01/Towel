import Image from "next/image";
import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { approvalQueue } from "@/lib/marketplace";
import { PLACEHOLDER } from "@/lib/placeholder";
import { prisma } from "@/lib/prisma";
import { store } from "@/lib/store";
import { AdminTitle, table } from "../ui";

export default async function ApprovalsPage({ searchParams }: PageProps<"/admin/approvals">) {
  await requireStaff("approvals");
  const { done } = await searchParams;
  const items = await prisma.product.findMany({
    where: approvalQueue,
    include: {
      seller: { select: { name: true } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 1, select: { url: true } },
      _count: { select: { images: { where: { approved: false } } } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <>
      <AdminTitle title="Approvals" sub="Sellers' new products, and changes to live ones, wait here until you check them. Oldest first." />
      {done && (
        <p className="mb-5 border border-ok/40 bg-white px-4 py-3 text-sm" role="status">
          {done === "approved" ? "Approved and the seller has been emailed." : "Sent back to the seller with your note."}
        </p>
      )}
      {items.length === 0 ? (
        <p className="text-grey border border-line bg-white p-10 text-center">Nothing waiting.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[40rem]`}>
            <thead>
              <tr>
                <th className="w-16" />
                <th>Product</th>
                <th>Seller</th>
                <th>What to check</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/approvals/${p.id}`} className="relative block size-12 bg-bone">
                      <Image src={p.images[0]?.url ?? PLACEHOLDER} alt="" fill sizes="48px" className="object-cover" />
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/approvals/${p.id}`} className="font-semibold hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.seller?.name}</td>
                  <td>
                    {p.reviewStatus !== "approved"
                      ? "New product"
                      : [p.pendingChanges && "Description changes", p._count.images && `${p._count.images} new photo${p._count.images === 1 ? "" : "s"}`].filter(Boolean).join(", ")}
                  </td>
                  <td className="text-grey whitespace-nowrap">{p.submittedAt?.toLocaleDateString("en-AU", { timeZone: store.timeZone }) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
