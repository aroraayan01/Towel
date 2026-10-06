import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";

const getMaker = (slug: string) =>
  prisma.seller.findFirst({
    where: { slug, status: "active" },
    select: { id: true, name: true, bio: true, website: true, instagram: true, shipFromSuburb: true, shipFromState: true, dispatchDays: true },
  });

export async function generateMetadata({ params }: PageProps<"/makers/[slug]">): Promise<Metadata> {
  const m = await getMaker((await params).slug);
  if (!m) return {};
  return { title: m.name, description: m.bio.slice(0, 160) || `Products by ${m.name}.`, alternates: { canonical: `/makers/${(await params).slug}` } };
}

export default async function MakerPage({ params }: PageProps<"/makers/[slug]">) {
  const { slug } = await params;
  const m = await getMaker(slug);
  if (!m) notFound();
  const products = await listProducts({ sellerId: m.id });

  return (
    <div className="page-x py-10 md:py-14">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/makers", label: "Our makers" }, { label: m.name }]} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr] md:gap-16">
        <div>
          <h1 className="wide text-4xl md:text-5xl">{m.name}</h1>
          <p className="mt-3 text-[13px] text-grey">
            {m.shipFromSuburb && m.shipFromState && `Ships from ${m.shipFromSuburb}, ${m.shipFromState}, `}
            within {m.dispatchDays} business day{m.dispatchDays === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-4 text-[15px] leading-relaxed text-[#3b3a38]">
          {m.bio
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          {(m.website || m.instagram) && (
            <p className="text-[13px] text-grey">
              {m.website && (
                <a href={m.website} target="_blank" rel="noopener noreferrer" className="link mr-4">
                  Website
                </a>
              )}
              {m.instagram && (
                <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noopener noreferrer" className="link">
                  Instagram
                </a>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-14 border-t border-line pt-10">
        {products.length ? <ProductGrid products={products} eager={4} /> : <p className="py-16 text-center text-grey">Nothing listed just yet.</p>}
      </div>
    </div>
  );
}
