import Link from "next/link";

import { Photo } from "@/components/Photo";
import { ProductGrid } from "@/components/product/ProductCard";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { listProducts } from "@/lib/products";
import { store } from "@/lib/store";

// Stock and reviews change, so render per request
export const dynamic = "force-dynamic";

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

const MATERIALS = [
  {
    name: "Australian merino",
    body: "Breathes, regulates temperature and moves moisture away, so you sleep warm without overheating.",
    image: u("1542728929-2b5d9a0c8d48"),
    href: "/shop/quilts",
  },
  {
    name: "French flax linen",
    body: "Stonewashed for softness. Cool in summer, warm in winter, and it lasts for years.",
    image: u("1634665810235-011d663754e7"),
    href: "/shop/bed-linen",
  },
  {
    name: "Full-grain leather",
    body: "The strongest part of the hide, left uncorrected so it darkens and softens with use.",
    image: u("1787005241178-c9006ea9610b"),
    href: "/shop/leather",
  },
  {
    name: "Long-staple cotton",
    body: "Longer fibres make softer, stronger towels that shed less and last longer.",
    image: u("1638232928539-6e91c47ddec5"),
    href: "/shop/bath",
  },
];

export default async function HomePage() {
  const all = await listProducts();
  const bestsellers = all.filter((p) => p.bestseller).slice(0, 8);
  const leather = all.filter((p) => p.category === "leather" && (p.bestseller || p.collection === "bags")).slice(0, 4);
  const bedding = all.filter((p) => p.category === "bedding").slice(0, 3);
  const fresh = all.filter((p) => p.isNew).slice(0, 4);

  return (
    <>
      {/* Hero, sitting under the transparent header */}
      <section className="relative -mt-16 h-[92svh] max-h-[980px] min-h-[560px] overflow-hidden md:-mt-[76px]">
        <div className="animate-settle absolute inset-0">
          <Photo src={u("1601276174812-63280a55656e")} alt="White bedding in morning sun" sizes="100vw" preload />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
        <div className="page-x absolute inset-x-0 bottom-0 pb-14 text-white md:pb-20">
          <p className="caps animate-rise !tracking-[0.2em] text-white/85">Bath · Bedding · Rugs · Leather</p>
          <h1 className="animate-rise mt-5 max-w-4xl text-[52px] leading-[1] [animation-delay:120ms] md:text-[96px]">Made to be used.</h1>
          <p className="animate-rise mt-5 max-w-md text-[15px] text-white/85 [animation-delay:240ms] md:text-base">
            Towels, bedding, rugs and full-grain leather, designed in {store.address.suburb} and delivered Australia-wide.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:360ms]">
            <Link href="/shop/bedding" className="btn btn-white">
              Shop bedding
            </Link>
            <Link href="/shop/leather" className="btn border border-white/70 text-white hover:bg-white hover:text-ink">
              Shop leather
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="page-x pt-16 md:pt-24" aria-label="Shop by category">
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {CATEGORY_ORDER.map((cat) => (
            <Link key={cat} href={`/shop/${cat}`} className="group relative block aspect-[3/4] overflow-hidden bg-bone">
              <Photo
                src={CATEGORIES[cat].image}
                alt=""
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="transition duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
                <h2 className="text-[30px] md:text-[40px]">{CATEGORIES[cat].name}</h2>
                <p className="caps mt-2 !text-[11px] text-white/80">
                  <span className="hover-line">Shop now</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Service promises */}
      <section className="page-x py-14 md:py-16" aria-label="Our promises">
        <ul className="grid grid-cols-2 gap-y-8 border-y border-line py-8 text-center md:grid-cols-4">
          {[
            ["Complimentary delivery", `On orders over ${formatPrice(store.commerce.freeShippingThresholdCents)}`],
            [`${store.commerce.returnDays}-day returns`, "On anything unused"],
            ["Initials", "Embroidered or debossed"],
            ["Afterpay", "Four interest-free payments"],
          ].map(([t, s]) => (
            <li key={t} className="px-3">
              <p className="caps !tracking-[0.12em]">{t}</p>
              <p className="mt-1.5 text-[13px] text-grey">{s}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Bestsellers */}
      <section className="page-x pb-16 md:pb-24">
        <SectionHead title="Bestsellers" href="/shop" link="Shop all" />
        <ProductGrid products={bestsellers} />
      </section>

      {/* Leather editorial */}
      <section className="relative h-[80svh] max-h-[860px] min-h-[480px] overflow-hidden bg-[#2a170f]">
        <Photo src={u("1637759292654-a12cb2be085e")} alt="Close-up of cognac full-grain leather and stitching" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
        <div className="page-x absolute inset-0 flex flex-col justify-center text-white">
          <p className="caps !tracking-[0.2em] text-brass">The leather edit</p>
          <h2 className="mt-5 max-w-xl text-[40px] leading-[1.05] md:text-[68px]">Full-grain, and better every year.</h2>
          <p className="mt-6 max-w-md text-white/80">
            Weekenders, satchels, wallets and pieces for the home, cut from full-grain and vegetable-tanned hides. Add your
            initials to most pieces.
          </p>
          <Link href="/shop/leather" className="btn btn-white mt-9 self-start">
            Shop leather
          </Link>
        </div>
      </section>
      <section className="page-x py-14 md:py-20">
        <ProductGrid products={leather} />
      </section>

      {/* Bedding editorial */}
      <section className="bg-bone">
        <div className="page-x grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="relative aspect-[4/5]">
            <Photo src={u("1639813806536-11895df1ff64")} alt="Sage linen bedding on a timber bed" sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          <div>
            <p className="caps !tracking-[0.2em] text-brass">Bedding</p>
            <h2 className="mt-5 text-[38px] leading-[1.05] md:text-[56px]">Linen, merino and silk.</h2>
            <p className="mt-6 max-w-md text-grey">
              Stonewashed French linen that softens with every wash, Australian merino quilts that breathe, and mulberry silk
              pillowcases. Quilts come in five sizes from Single to Super King.
            </p>
            <div className="mt-9 grid grid-cols-3 gap-3">
              {bedding.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                    <Photo src={p.image} alt={p.imageAlt} sizes="15vw" className="transition duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <p className="mt-2 text-[13px] leading-snug">{p.name}</p>
                </Link>
              ))}
            </div>
            <Link href="/shop/bedding" className="btn btn-dark mt-9">
              Shop bedding
            </Link>
          </div>
        </div>
      </section>

      {/* New in */}
      {fresh.length > 0 && (
        <section className="page-x py-16 md:py-24">
          <SectionHead title="New arrivals" href="/shop?sort=newest" link="View all" />
          <ProductGrid products={fresh} />
        </section>
      )}

      {/* Materials */}
      <section className="border-t border-line">
        <div className="page-x py-16 md:py-24">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-[34px] md:text-[48px]">What it&apos;s made from</h2>
            <p className="mt-4 text-grey">We choose materials first and design around them. Every product page lists exactly what it&apos;s made of and how to care for it.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {MATERIALS.map((m) => (
              <Link key={m.name} href={m.href} className="group block">
                <div className="relative aspect-square overflow-hidden bg-bone">
                  <Photo src={m.image} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="transition duration-700 group-hover:scale-[1.04]" />
                </div>
                <h3 className="wide mt-4 text-[22px] !font-normal">{m.name}</h3>
                <p className="mt-2 text-[14px] text-grey">{m.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-forest text-white">
        <div className="page-x grid items-center gap-10 py-16 md:grid-cols-[1fr_1.2fr] md:gap-20 md:py-24">
          <div className="relative aspect-[4/5]">
            <Photo src={u("1783066070372-a1b0fffb7c53")} alt="Folded towels in afternoon light" sizes="(min-width: 768px) 45vw, 100vw" />
          </div>
          <div className="max-w-xl">
            <p className="caps !tracking-[0.2em] text-brass">About xomexo</p>
            <p className="wide mt-6 text-[30px] leading-[1.2] md:text-[42px]">
              We keep the range small, and everything we sell is used in our own home first.
            </p>
            <p className="mt-6 text-white/75">
              Orders are packed by us in {store.address.suburb}. If something isn&apos;t right, email us and a real person will
              sort it out.
            </p>
            <Link href="/about" className="btn btn-white mt-9">
              Our story
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="text-[34px] md:text-[48px]">{title}</h2>
      <Link href={href} className="caps shrink-0 !text-[11px]">
        <span className="hover-line">{link}</span>
      </Link>
    </div>
  );
}
