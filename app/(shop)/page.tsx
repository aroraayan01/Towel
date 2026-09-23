import Link from "next/link";

import { Photo } from "@/components/Photo";
import { ProductGrid } from "@/components/product/ProductCard";
import { COLLECTIONS } from "@/lib/collections";
import { listProducts } from "@/lib/products";
import { store } from "@/lib/store";

// Stock and reviews change, so render per request
export const dynamic = "force-dynamic";

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export default async function HomePage() {
  const all = await listProducts();
  const bestsellers = all.filter((p) => p.bestseller).slice(0, 4);
  const fresh = all.filter((p) => p.isNew).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[78svh] max-h-[880px] min-h-[480px] md:h-[88svh]">
        <Photo src={u("1596683705523-eb49540c3934")} alt="A white cotton towel hanging in morning light" sizes="100vw" preload />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="page-x absolute inset-x-0 bottom-0 pb-10 text-white md:pb-16">
          <h1 className="wide max-w-3xl text-[44px] leading-[1.02] md:text-[80px]">Made to be used.</h1>
          <p className="mt-4 max-w-md text-[15px] text-white/85 md:text-base">
            Cotton towels and natural-fibre rugs, designed in {store.address.suburb} and delivered Australia-wide.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop/towels" className="btn btn-white">
              Shop towels
            </Link>
            <Link href="/shop/rugs" className="btn border border-white text-white hover:bg-white hover:text-ink">
              Shop rugs
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="page-x py-14 md:py-20">
        <div className="mb-7 flex items-end justify-between">
          <h2 className="text-2xl md:text-3xl">Bestsellers</h2>
          <Link href="/shop" className="link text-[14px]">
            View all
          </Link>
        </div>
        <ProductGrid products={bestsellers} />
      </section>

      {/* Beach editorial */}
      <section className="grid md:grid-cols-2">
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[640px]">
          <Photo src={u("1760783320488-9af5d3217f50")} alt="Flat-weave beach towel on the rocks by the ocean" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="flex items-center bg-bone px-6 py-14 md:px-16">
          <div className="max-w-md">
            <p className="caps text-grey">Beach towels</p>
            <h2 className="wide mt-4 text-3xl md:text-[44px]">Sand shakes off. Dries in an hour.</h2>
            <p className="mt-5 text-grey">
              Our flat-weave and Turkish towels have no loops for sand to cling to. They weigh next to nothing, fold down to
              the size of a paperback and dry on the walk back to the car.
            </p>
            <Link href="/shop/beach-towels" className="btn btn-dark mt-8">
              Shop beach towels
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="page-x py-14 md:py-20">
        <h2 className="mb-7 text-2xl md:text-3xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5">
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/shop/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-bone">
                <Photo src={c.image} alt="" sizes="(min-width: 768px) 33vw, 50vw" className="transition duration-700 group-hover:scale-[1.03]" />
              </div>
              <p className="mt-3 text-[15px]">
                <span className="hover-line">{c.name}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Rugs banner */}
      <section className="relative h-[70svh] max-h-[760px] min-h-[420px]">
        <Photo src={u("1778088442792-29c430a4c93f")} alt="Braided jute rug under a leather sofa" sizes="100vw" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="page-x absolute inset-0 flex flex-col items-start justify-end pb-10 text-white md:pb-16">
          <p className="caps">Rugs</p>
          <h2 className="wide mt-3 max-w-xl text-3xl md:text-[52px] md:leading-[1.05]">Rugs for every room, from the hallway to the bath.</h2>
          <Link href="/shop/rugs" className="btn btn-white mt-7">
            Shop rugs & mats
          </Link>
        </div>
      </section>

      {/* New in */}
      {fresh.length > 0 && (
        <section className="page-x py-14 md:py-20">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl">New in</h2>
            <Link href="/shop?sort=newest" className="link text-[14px]">
              View all
            </Link>
          </div>
          <ProductGrid products={fresh} />
        </section>
      )}

      {/* About */}
      <section className="page-x grid items-center gap-10 pb-16 md:grid-cols-2 md:gap-16 md:pb-24">
        <div className="relative aspect-[4/5] bg-bone">
          <Photo src={u("1783066070372-a1b0fffb7c53")} alt="Stack of folded towels in afternoon light" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="max-w-lg">
          <p className="caps text-grey">About us</p>
          <p className="mt-5 text-2xl leading-snug md:text-[30px]">
            We keep the range small, and every towel and rug is used in our own home before it goes on sale.
          </p>
          <p className="mt-5 text-grey">
            We pack orders ourselves in {store.address.suburb}. If something isn&apos;t right, email us and a real person will sort it
            out.
          </p>
          <Link href="/about" className="link mt-6 inline-block text-[14px]">
            Read more
          </Link>
        </div>
      </section>
    </>
  );
}
