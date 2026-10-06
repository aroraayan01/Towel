import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTitle } from "@/app/admin/ui";
import { ProductEditor } from "@/components/catalogue/ProductEditor";
import { ProductImages } from "@/components/catalogue/ProductImages";
import { contentOf, FIELD_LABEL, type ContentField, type ProductContent } from "@/lib/catalogue";
import { isCategory } from "@/lib/collections";
import { parseJson } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller-auth";
import { sellerDeleteImage, sellerDeleteProduct, sellerMoveImage, sellerSaveProduct, sellerUpdateImage } from "../../actions";
import { ReviewBadge } from "../../ui";

const money = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2));

const SAVED: Record<string, string> = {
  new: "Saved and sent for review. Now add your photos. We'll email you once it's approved.",
  resubmitted: "Saved and sent for review again.",
  pending: "Saved. Your description changes are waiting for review; the shop shows the previous version until then. Price and stock changes are already live.",
  saved: "Saved. Changes are live.",
};

export default async function SellerProductPage({ params, searchParams }: PageProps<"/seller/products/[id]">) {
  const me = await requireSeller();
  const { id } = await params;
  const { saved, note } = await searchParams;

  const p = await prisma.product.findFirst({
    where: { id, sellerId: me.seller.id },
    include: {
      variants: { where: { archived: false }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { orderItems: true } } } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!p) notFound();

  // Show the seller their own latest version, including changes still in review
  const pending = parseJson<Partial<ProductContent>>(p.pendingChanges, {});
  const content = { ...contentOf(p), ...pending };
  const colours = [...new Set(p.variants.map((v) => v.colourName))];
  const pendingFields = Object.keys(pending) as ContentField[];
  const pendingPhotos = p.images.filter((i) => !i.approved).length;

  return (
    <>
      <Link href="/seller/products" className="text-grey text-sm hover:underline">
        ← Products
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminTitle title={content.name} />
        <div className="flex items-center gap-3">
          <ReviewBadge status={p.reviewStatus} active={p.active} changes={pendingFields.length > 0} />
          {p.reviewStatus === "approved" && (
            <Link href={`/products/${p.slug}`} target="_blank" className="btn btn-line h-9 px-4 text-[12px]">
              View in shop ↗
            </Link>
          )}
        </div>
      </div>

      {typeof saved === "string" && SAVED[saved] && (
        <p className="mb-5 border border-ok/40 bg-white px-4 py-3 text-sm" role="status">
          {SAVED[saved]}
        </p>
      )}
      {typeof note === "string" && (
        <p className="mb-5 border border-[#c9a13b]/60 bg-white px-4 py-3 text-sm" role="status">
          {note}
        </p>
      )}
      {p.reviewStatus === "rejected" && (
        <div className="mb-5 border border-sale/50 bg-white px-4 py-3 text-sm">
          <p className="font-semibold">This product needs changes before it can go live.</p>
          {p.reviewNote && <p className="mt-1">Our note: {p.reviewNote}</p>}
          <p className="text-grey mt-1">Make the changes and save to send it back for review.</p>
        </div>
      )}
      {p.reviewStatus === "approved" && p.reviewNote && pendingFields.length === 0 && (
        <div className="mb-5 border border-sale/50 bg-white px-4 py-3 text-sm">
          <p>Your last changes weren&apos;t approved. Our note: {p.reviewNote}</p>
        </div>
      )}
      {(pendingFields.length > 0 || (p.reviewStatus === "approved" && pendingPhotos > 0)) && (
        <p className="mb-5 border border-dashed border-line bg-white px-4 py-3 text-sm">
          Waiting for review:{" "}
          {[...pendingFields.map((f) => FIELD_LABEL[f].toLowerCase()), pendingPhotos > 0 && `${pendingPhotos} new photo${pendingPhotos === 1 ? "" : "s"}`].filter(Boolean).join(", ")}.
          The shop shows the approved version until then.
        </p>
      )}

      <div className="mb-6">
        <ProductImages
          images={p.images.map(({ id, url, alt, colourName, approved }) => ({ id, url, alt, colourName, approved }))}
          colours={colours}
          uploadUrl={`/api/seller/products/${p.id}/images`}
          actions={{ update: sellerUpdateImage, move: sellerMoveImage, remove: sellerDeleteImage }}
        />
      </div>

      <ProductEditor
        key={p.updatedAt.toISOString()}
        mode="seller"
        save={sellerSaveProduct}
        remove={sellerDeleteProduct}
        product={{
          id: p.id,
          slug: p.slug,
          name: content.name,
          category: isCategory(content.category) ? content.category : "bath",
          collection: content.collection,
          tagline: content.tagline,
          description: content.description,
          details: content.details,
          specs: content.specs,
          material: content.material,
          care: content.care,
          active: p.active,
          featured: p.featured,
          bestseller: p.bestseller,
          isNew: p.isNew,
          monogramable: content.monogramable,
          variants: p.variants.map((v) => ({
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
