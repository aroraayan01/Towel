import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff } from "@/lib/admin-auth";
import { isCategory } from "@/lib/collections";
import { parseJson } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { AdminTitle } from "../../ui";
import { ProductEditor } from "@/components/catalogue/ProductEditor";
import { ProductImages } from "@/components/catalogue/ProductImages";
import { deleteImage, deleteProduct, moveImage, saveProduct, updateImage } from "../actions";

const money = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2));

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff("products");
  const { id } = await params;
  const { saved, note } = await searchParams;

  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { orderItems: true } } } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!p) notFound();

  const details = parseJson<string[]>(p.details, []);
  const specs = parseJson<{ label: string; value: string }[]>(p.specs, []);

  // Options kept only for order history (removed, but ordered before) are left out of the editor
  const variants = p.variants.filter((v) => !v.archived);
  const colours = [...new Set(variants.map((v) => v.colourName))];

  return (
    <>
      <Link href="/admin/products" className="text-grey text-sm hover:underline">
        ← Products
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle title={p.name} sub={p.active ? "Live in the shop" : "Hidden from the shop"} />
        <Link href={`/products/${p.slug}`} target="_blank" className="btn btn-line h-9 px-4 text-[12px]">
          View in shop ↗
        </Link>
      </div>

      {saved && (
        <p className="mb-5 border border-ok/40 bg-white px-4 py-3 text-sm" role="status">
          {saved === "new" ? "Product created. Now add some photos below." : "Saved."}
        </p>
      )}
      {typeof note === "string" && (
        <p className="mb-5 border border-[#c9a13b]/60 bg-white px-4 py-3 text-sm" role="status">
          {note}
        </p>
      )}
      {p.fromSeed && (
        <p className="mb-5 border border-dashed border-line bg-white px-4 py-3 text-sm">
          This is a <strong>sample product</strong> with stock photos. Edit it into one of yours, or delete it.
        </p>
      )}

      <div className="mb-6">
        <ProductImages
          images={p.images.map(({ id, url, alt, colourName, approved }) => ({ id, url, alt, colourName, approved }))}
          colours={colours}
          uploadUrl={`/api/admin/products/${p.id}/images`}
          actions={{ update: updateImage, move: moveImage, remove: deleteImage }}
        />
      </div>

      <ProductEditor
        key={p.updatedAt.toISOString()}
        save={saveProduct}
        remove={deleteProduct}
        product={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: isCategory(p.category) ? p.category : "bath",
          collection: p.collection,
          tagline: p.tagline,
          description: p.description,
          details,
          specs,
          material: p.material,
          care: p.care,
          active: p.active,
          featured: p.featured,
          bestseller: p.bestseller,
          isNew: p.isNew,
          monogramable: p.monogramable,
          variants: variants.map((v) => ({
            id: v.id,
            colourName: v.colourName,
            colourHex: v.colourHex,
            size: v.size,
            price: money(v.priceCents),
            compareAt: money(v.compareAtCents),
            stock: String(v.stock),
            sku: v.sku,
            ordered: v._count.orderItems > 0,
          })),
        }}
      />
    </>
  );
}
