import Image from "next/image";
import Link from "next/link";

import type { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { CATEGORIES, CATEGORY_ORDER, collectionBySlug, isCategory } from "@/lib/collections";
import { formatMoney } from "@/lib/money";
import { PLACEHOLDER } from "@/lib/placeholder";
import { prisma } from "@/lib/prisma";
import { toggleProduct } from "../actions";
import { AdminTitle, table } from "../ui";
import { DeleteSamplesButton } from "./DeleteSamplesButton";

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const category = typeof sp.category === "string" && isCategory(sp.category) ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }, { variants: { some: { sku: { contains: q.toUpperCase() } } } }] } : {}),
  };
  const [products, sampleCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: { where: { archived: false }, select: { priceCents: true, stock: true } },
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 1, select: { url: true } },
      },
      orderBy: [{ fromSeed: "asc" }, { updatedAt: "desc" }],
    }),
    // Only samples customers can still see; ordered ones that were hidden don't count
    prisma.product.count({ where: { fromSeed: true, active: true } }),
  ]);

  const tab = (c?: string) => `/admin/products${c ? `?category=${c}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle title="Products" sub="Prices include GST. Click a product to edit its details, options, stock and photos." />
        <Link href="/admin/products/new" className="btn btn-dark h-11 px-5">
          New product
        </Link>
      </div>

      <Flash sp={sp} />

      {sampleCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-dashed border-line bg-white px-4 py-3 text-sm">
          <p>
            <strong>{sampleCount} sample products</strong> from the starter catalogue are still in the shop, with stock photos. Edit them into
            your own, or remove them all once your real products are in.
          </p>
          <DeleteSamplesButton count={sampleCount} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Filter by category">
          {[undefined, ...CATEGORY_ORDER].map((c) => (
            <Link
              key={c ?? "all"}
              href={tab(c)}
              className={`px-3 py-1.5 ${c === category ? "bg-ink text-white" : "bg-white hover:bg-stone"}`}
              aria-current={c === category ? "page" : undefined}
            >
              {c ? CATEGORIES[c].name : "All"}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <input name="q" defaultValue={q} placeholder="Search name or SKU" className="input w-56 py-1.5 text-sm" aria-label="Search products" />
        </form>
      </div>

      {products.length === 0 ? (
        <div className="border border-line bg-white p-10 text-center">
          <p className="text-grey">{q || category ? "No products match." : "No products yet."}</p>
          <Link href="/admin/products/new" className="btn btn-dark mt-4 inline-flex h-10 px-5">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className={`${table} min-w-[44rem]`}>
            <thead>
              <tr>
                <th className="w-16" />
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prices = p.variants.map((v) => v.priceCents);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                const out = p.variants.filter((v) => v.stock <= 0).length;
                return (
                  <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="relative block size-12 bg-bone">
                        <Image src={p.images[0]?.url ?? PLACEHOLDER} alt="" fill sizes="48px" className="object-cover" />
                      </Link>
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <span className="text-grey block text-xs">
                        {collectionBySlug(p.collection)?.name ?? p.collection} · {p.variants.length} option{p.variants.length === 1 ? "" : "s"}
                        {p.images.length === 0 && " · no photos"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{prices.length ? (min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`) : "—"}</td>
                    <td className="whitespace-nowrap">
                      <span className={stock === 0 ? "text-sale font-semibold" : ""}>{stock}</span>
                      {out > 0 && stock > 0 && <span className="text-grey block text-xs">{out} sold out</span>}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-forest/10 text-forest" : "bg-stone text-grey"}`}>
                        {p.active ? "Live" : "Hidden"}
                      </span>
                      {p.fromSeed && <span className="text-grey ml-1.5 text-xs">Sample</span>}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <form action={toggleProduct} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-grey mr-4 text-xs hover:underline">{p.active ? "Hide" : "Show"}</button>
                      </form>
                      <Link href={`/admin/products/${p.id}`} className="text-sm font-semibold hover:underline">
                        Edit
                      </Link>
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

function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  let msg = "";
  if (typeof sp.deleted === "string") msg = `Deleted "${sp.deleted}".`;
  if (typeof sp.removed === "string") {
    msg = `Removed ${sp.removed} sample product${sp.removed === "1" ? "" : "s"}.`;
    if (sp.hidden && sp.hidden !== "0") msg += ` ${sp.hidden} had orders, so they were hidden instead.`;
  }
  if (!msg) return null;
  return (
    <p className="mb-5 border border-ok/40 bg-white px-4 py-3 text-sm" role="status">
      {msg}
    </p>
  );
}
