import Image from "next/image";
import Link from "next/link";

import { AdminTitle, table } from "@/app/admin/ui";
import { collectionBySlug } from "@/lib/collections";
import { formatMoney } from "@/lib/money";
import { PLACEHOLDER } from "@/lib/placeholder";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { ReviewBadge } from "../ui";

export default async function SellerProductsPage({ searchParams }: PageProps<"/seller/products">) {
  const me = await requireSeller();
  const { deleted } = await searchParams;
  const products = await prisma.product.findMany({
    where: { sellerId: me.seller.id },
    include: {
      variants: { where: { archived: false }, select: { priceCents: true, stock: true } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 1, select: { url: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle title="Products" sub="New products and changes to descriptions are checked by us before they show in the shop. Prices and stock update straight away." />
        <Link href="/seller/products/new" className="btn btn-dark h-11 px-5">
          New product
        </Link>
      </div>
      {typeof deleted === "string" && (
        <p className="mb-5 border border-ok/40 bg-white px-4 py-3 text-sm" role="status">
          Deleted &ldquo;{deleted}&rdquo;.
        </p>
      )}

      {products.length === 0 ? (
        <div className="border border-line bg-white p-10 text-center">
          <p className="text-grey">You haven&apos;t added any products yet.</p>
          <Link href="/seller/products/new" className="btn btn-dark mt-4 inline-flex h-10 px-5">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[40rem]`}>
            <thead>
              <tr>
                <th className="w-16" />
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prices = p.variants.map((v) => v.priceCents);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/seller/products/${p.id}`} className="relative block size-12 bg-bone">
                        <Image src={p.images[0]?.url ?? PLACEHOLDER} alt="" fill sizes="48px" className="object-cover" />
                      </Link>
                    </td>
                    <td>
                      <Link href={`/seller/products/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <span className="text-grey block text-xs">{collectionBySlug(p.collection)?.name ?? p.collection}</span>
                    </td>
                    <td className="whitespace-nowrap">{prices.length ? (min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`) : "—"}</td>
                    <td className={stock === 0 ? "text-sale font-semibold" : ""}>{stock}</td>
                    <td>
                      <ReviewBadge status={p.reviewStatus} active={p.active} changes={!!p.pendingChanges} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
