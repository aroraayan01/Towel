import type { Metadata } from "next";
import Link from "next/link";

import { Photo } from "@/components/Photo";
import { Breadcrumbs } from "@/components/ui";
import { PLACEHOLDER } from "@/lib/placeholder";
import { prisma } from "@/lib/prisma";
import { visibleProduct } from "@/lib/products";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Our makers",
  description: `Independent Australian makers who sell through ${store.name}.`,
  alternates: { canonical: "/makers" },
};

export const dynamic = "force-dynamic";

export default async function MakersPage() {
  const makers = await prisma.seller.findMany({
    where: { status: "active", products: { some: visibleProduct } },
    select: {
      slug: true,
      name: true,
      bio: true,
      shipFromSuburb: true,
      shipFromState: true,
      products: {
        where: visibleProduct,
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { images: { where: { approved: true }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
      },
      _count: { select: { products: { where: visibleProduct } } },
    },
    orderBy: { approvedAt: "asc" },
  });

  return (
    <div className="page-x py-10 md:py-14">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Our makers" }]} />
      <h1 className="wide mt-6 text-4xl md:text-5xl">Our makers</h1>
      <p className="mt-4 max-w-2xl text-[16px] text-grey">
        Independent businesses who sell through {store.name}. Each one makes and posts their own work.{" "}
        <Link href="/sell" className="link text-ink">
          Sell with us
        </Link>
      </p>

      {makers.length === 0 ? (
        <p className="mt-16 border-t border-line pt-16 text-center text-grey">No makers yet.</p>
      ) : (
        <ul className="mt-12 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {makers.map((m) => (
            <li key={m.slug}>
              <Link href={`/makers/${m.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-bone">
                  <Photo
                    src={m.products[0]?.images[0]?.url ?? PLACEHOLDER}
                    alt=""
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <h2 className="mt-4 text-xl">{m.name}</h2>
                <p className="text-[13px] text-grey">
                  {[m.shipFromSuburb && m.shipFromState && `${m.shipFromSuburb}, ${m.shipFromState}`, `${m._count.products} product${m._count.products === 1 ? "" : "s"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {m.bio && <p className="mt-2 line-clamp-2 text-[14px] text-[#3b3a38]">{m.bio}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
