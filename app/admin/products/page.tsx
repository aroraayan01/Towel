import Link from "next/link";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { toggleProduct, updateVariant } from "../actions";
import { AdminTitle, card } from "../ui";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ category: "desc" }, { collection: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <AdminTitle title="Products & stock" sub="Edit a price or stock level and press Enter (or Save) on that row. Prices include GST." />
      <div className="space-y-6">
        {products.map((p) => (
          <section key={p.id} className={`${card} ${p.active ? "" : "opacity-60"}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-lg font-semibold">
                  <Link href={`/products/${p.slug}`} target="_blank" className="hover:underline">{p.name}</Link>
                </h2>
                <p className="text-muted text-xs">{p.collection} · {p.variants.length} variants{!p.active && " · HIDDEN from shop"}</p>
              </div>
              <form action={toggleProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className="btn btn-outline px-3 py-1.5 text-xs">{p.active ? "Hide from shop" : "Show in shop"}</button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[36rem] divide-y divide-line text-sm">
                {p.variants.map((v) => (
                  <form key={v.id} action={updateVariant} className="grid grid-cols-[1.5rem_1fr_7rem_6rem_4rem] items-center gap-3 py-2">
                    <input type="hidden" name="id" value={v.id} />
                    <span className="size-5 rounded-full ring-1 ring-line" style={{ background: v.colourHex }} />
                    <span>
                      {v.colourName} · {v.size}
                      <span className="text-muted block text-xs">{v.sku}</span>
                    </span>
                    <label className="flex items-center gap-1">
                      <span className="text-muted">$</span>
                      <input name="price" type="number" step="0.01" min="0" defaultValue={(v.priceCents / 100).toFixed(2)} className="field px-2 py-1" aria-label={`Price for ${v.sku}`} />
                    </label>
                    <label className="flex items-center gap-1">
                      <input name="stock" type="number" step="1" defaultValue={v.stock} className={`field px-2 py-1 ${v.stock <= 0 ? "border-clay" : v.stock <= 3 ? "border-wattle" : ""}`} aria-label={`Stock for ${v.sku}`} />
                    </label>
                    <button className="text-sm font-semibold text-gum hover:underline">Save</button>
                  </form>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
      <p className="text-muted mt-6 text-sm">
        To add new products or change descriptions, edit <code>prisma/seed.ts</code> and run <code>npm run db:seed</code>, or use{" "}
        <code>npm run db:studio</code>.
      </p>
    </>
  );
}
