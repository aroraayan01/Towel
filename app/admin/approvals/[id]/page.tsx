import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff } from "@/lib/admin-auth";
import { contentOf, FIELD_LABEL, type ContentField, type ProductContent } from "@/lib/catalogue";
import { CATEGORIES, collectionBySlug, isCategory } from "@/lib/collections";
import { parseJson } from "@/lib/json";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { AdminTitle, card } from "../../ui";
import { approveListing } from "../actions";
import { RejectForm } from "./RejectForm";

/** A content value as readable text, for previews and before/after. */
function show(field: ContentField, v: ProductContent[ContentField] | undefined) {
  if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return <span className="text-grey">(empty)</span>;
  if (field === "details") return <ul className="list-disc pl-4">{(v as string[]).map((d, i) => <li key={i}>{d}</li>)}</ul>;
  if (field === "specs")
    return (
      <dl className="grid grid-cols-[auto_1fr] gap-x-3">
        {(v as { label: string; value: string }[]).map((s, i) => (
          <div key={i} className="contents">
            <dt className="text-grey">{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    );
  if (field === "category") return isCategory(String(v)) ? CATEGORIES[v as keyof typeof CATEGORIES].name : String(v);
  if (field === "collection") return collectionBySlug(String(v))?.name ?? String(v);
  if (field === "monogramable") return v ? "Offers personalisation" : "No personalisation";
  return <span className="whitespace-pre-line">{String(v)}</span>;
}

export default async function ReviewPage({ params }: PageProps<"/admin/approvals/[id]">) {
  await requireStaff("approvals");
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, gstRegistered: true } },
      variants: { where: { archived: false }, orderBy: { sortOrder: "asc" } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!p || !p.seller) notFound();

  const isNew = p.reviewStatus !== "approved";
  const live = contentOf(p);
  const changes = parseJson<Partial<ProductContent>>(p.pendingChanges, {});
  const changed = Object.keys(changes) as ContentField[];
  const newPhotos = p.images.filter((i) => !i.approved);
  const nothing = !isNew && changed.length === 0 && newPhotos.length === 0;

  return (
    <>
      <Link href="/admin/approvals" className="text-grey text-sm hover:underline">
        ← Approvals
      </Link>
      <AdminTitle
        title={changes.name ?? p.name}
        sub={`${isNew ? (p.reviewStatus === "rejected" ? "Sent back earlier, resubmitted" : "New product") : "Changes to a live product"} from ${p.seller.name}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {(isNew ? p.images : newPhotos).length > 0 && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">{isNew ? "Photos" : "New photos"}</h2>
              <ul className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {(isNew ? p.images : newPhotos).map((img) => (
                  <li key={img.id} className="relative aspect-[4/5] bg-bone">
                    <a href={img.url} target="_blank" rel="noreferrer">
                      <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                    </a>
                    {img.colourName && <span className="absolute bottom-1 left-1 bg-white/90 px-1.5 text-[11px]">{img.colourName}</span>}
                  </li>
                ))}
              </ul>
              <p className="text-grey mt-2 text-xs">Check they show the actual product, with no other shop&apos;s branding or watermarks.</p>
            </section>
          )}

          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">{isNew ? "Listing" : "Changes"}</h2>
            {isNew ? (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[8rem_1fr]">
                {(Object.keys(FIELD_LABEL) as ContentField[]).map((f) => (
                  <div key={f} className="contents">
                    <dt className="text-grey">{FIELD_LABEL[f]}</dt>
                    <dd>{show(f, live[f])}</dd>
                  </div>
                ))}
              </dl>
            ) : changed.length === 0 ? (
              <p className="text-grey text-sm">No description changes, only new photos.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-grey text-xs">
                  <tr>
                    <th className="w-28 py-2 font-semibold" />
                    <th className="py-2 pr-4 font-semibold">Now</th>
                    <th className="py-2 font-semibold">Proposed</th>
                  </tr>
                </thead>
                <tbody>
                  {changed.map((f) => (
                    <tr key={f} className="border-t border-line align-top">
                      <th className="text-grey py-3 pr-3 font-normal">{FIELD_LABEL[f]}</th>
                      <td className="text-grey py-3 pr-4">{show(f, live[f])}</td>
                      <td className="bg-forest/5 py-3 pl-2">{show(f, changes[f])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {isNew && (
            <section className={card}>
              <h2 className="mb-3 font-sans text-[15px] font-semibold">Options and prices</h2>
              <ul className="divide-y divide-line text-sm">
                {p.variants.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2">
                    <span className="size-4 rounded-full ring-1 ring-line" style={{ background: v.colourHex }} />
                    <span className="flex-1">
                      {v.colourName} · {v.size}
                    </span>
                    <span className="tabular-nums">{formatMoney(v.priceCents)}</span>
                    <span className="text-grey w-20 text-right">{v.stock} in stock</span>
                  </li>
                ))}
              </ul>
              <p className="text-grey mt-2 text-xs">Prices include GST{p.seller.gstRegistered ? "" : " where it applies (this seller isn't registered, so none is charged)"}.</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">Decision</h2>
            {nothing ? (
              <p className="text-grey text-sm">Nothing waiting on this product any more.</p>
            ) : (
              <>
                <form action={approveListing}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-dark w-full">{isNew ? "Approve and publish" : "Approve changes"}</button>
                </form>
                <p className="text-grey mt-2 text-xs">{isNew ? "It goes live straight away" + (p.active ? "." : " once the seller switches it on.") : "The shop updates straight away."} The seller is emailed.</p>
                <div className="mt-6 border-t border-line pt-5">
                  <RejectForm id={p.id} isNew={isNew} />
                </div>
              </>
            )}
          </section>
          <section className={`${card} text-sm`}>
            <p>
              Seller:{" "}
              <Link href={`/admin/sellers/${p.seller.id}`} className="underline">
                {p.seller.name}
              </Link>
            </p>
            <p className="mt-2">
              <Link href={`/admin/products/${p.id}`} className="underline">
                Open in the product editor
              </Link>{" "}
              <span className="text-grey">to fix something small yourself (it shows the live version).</span>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
