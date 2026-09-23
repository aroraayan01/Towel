import Link from "next/link";
import { ArrowRight, Gift, HeartHandshake, RotateCcw, Sparkles, Truck } from "lucide-react";

import { ProductGrid } from "@/components/product/ProductCard";
import { TextileArt } from "@/components/TextileArt";
import { Stars } from "@/components/ui";
import { COLLECTIONS } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { store } from "@/lib/store";

// Stock and reviews change — render per request rather than freezing at build time
export const dynamic = "force-dynamic";

const PALETTE = [
  { name: "Harbour Blue", hex: "#3F6E8C", place: "Sydney Harbour" },
  { name: "Eucalypt", hex: "#7C9A86", place: "Blue Mountains" },
  { name: "Ochre", hex: "#C0803F", place: "Flinders Ranges" },
  { name: "Coral Bay", hex: "#E08E79", place: "Ningaloo Coast" },
  { name: "Wattle", hex: "#E3B23C", place: "Every spring" },
  { name: "Pink Lake", hex: "#E7A6A1", place: "Hutt Lagoon" },
  { name: "Sandstone", hex: "#D9C3A0", place: "Bondi to Coogee" },
  { name: "Ironbark", hex: "#5B4A42", place: "The Goldfields" },
];

export default async function HomePage() {
  const [all, reviews, agg] = await Promise.all([
    listProducts(),
    prisma.review.findMany({
      where: { approved: true, rating: 5 },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.review.aggregate({ where: { approved: true }, _avg: { rating: true }, _count: true }),
  ]);
  const bestsellers = all.filter((p) => p.bestseller).slice(0, 4);
  const fresh = all.filter((p) => p.isNew).slice(0, 4);
  const repFor = (collection: string) => all.find((p) => p.collection === collection);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="overflow-hidden bg-sand">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow mb-4">Designed in Australia · Est. at our kitchen table</p>
            <h1 className="text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Made for sandy feet &amp; slow Sundays.
            </h1>
            <p className="text-muted mt-6 max-w-lg text-lg">
              Thick, thirsty towels and rugs that can take a beating — chosen, tested and loved in our own home before
              they ever reach yours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop/towels" className="btn btn-primary">
                Shop towels <ArrowRight size={16} />
              </Link>
              <Link href="/shop/rugs" className="btn btn-outline">
                Shop rugs
              </Link>
            </div>
            {agg._count > 0 && agg._avg.rating && (
              <p className="text-muted mt-6 flex items-center gap-2 text-sm">
                <Stars rating={agg._avg.rating} />
                <span>
                  Rated {agg._avg.rating.toFixed(1)}/5 from {agg._count} customer reviews
                </span>
              </p>
            )}
          </div>

          <div className="relative mx-auto grid w-full max-w-lg grid-cols-5 gap-4">
            <div className="col-span-3 aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
              <TextileArt category="towels" collection="bath-towels" pattern="stripe" colour="#3F6E8C" accent="#F3EDE3" alt="Coogee Stripe towel in Harbour Blue hanging on a rail" />
            </div>
            <div className="col-span-2 flex flex-col gap-4 pt-10">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-lg">
                <TextileArt category="rugs" collection="area-rugs" pattern="diamond" colour="#A5522F" accent="#F2E6D3" view="alt" alt="Kimberley wool rug in a living room" />
              </div>
              <div className="aspect-square overflow-hidden rounded-3xl shadow-lg">
                <TextileArt category="towels" collection="beach-towels" pattern="stripe" colour="#E3B23C" accent="#FFF8E6" view="alt" alt="Bondi beach towels folded on a shelf" />
              </div>
            </div>
            <p className="absolute -bottom-2 left-2 -rotate-6 font-hand text-2xl text-gum sm:-left-6 sm:text-3xl" aria-hidden>
              our #1 towel ↑
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────── */}
      <section className="border-b border-line bg-white" aria-label="Why shop with us">
        <ul className="container-page grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {[
            { icon: Truck, title: `Free shipping over ${formatPrice(store.commerce.freeShippingThresholdCents)}`, sub: "Australia-wide, tracked" },
            { icon: RotateCcw, title: `${store.commerce.returnDays}-day returns`, sub: "Change of mind? No worries" },
            { icon: Gift, title: "Free handwritten notes", sub: "Gift wrapping available" },
            { icon: HeartHandshake, title: "Australian owned", sub: "Small team, real people" },
          ].map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gum-light text-gum">
                <Icon size={18} />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-muted">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Shop by collection ───────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Find your fit</p>
            <h2 className="text-3xl sm:text-4xl">Shop by collection</h2>
          </div>
          <Link href="/shop" className="hidden font-semibold text-gum hover:underline sm:block">
            Shop everything →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {COLLECTIONS.map((c, i) => {
            const p = repFor(c.slug);
            // Rotate through colourways so neighbouring tiles don't look alike
            const col = p?.colours[(i + 1) % p.colours.length];
            return (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
                {p && col && (
                  <TextileArt
                    category={p.category}
                    collection={p.collection}
                    pattern={p.pattern}
                    colour={col.hex}
                    accent={col.accent}
                    view={c.slug === "bath-towels" ? "alt" : "main"}
                    alt=""
                    className="transition duration-500 group-hover:scale-105"
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-12 text-white">
                  <span className="block font-serif text-xl sm:text-2xl">{c.name}</span>
                  <span className="hidden text-sm text-white/85 sm:block">{c.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Bestsellers ──────────────────────────────────── */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Tried, tested, re-ordered</p>
            <h2 className="text-3xl sm:text-4xl">Bestsellers</h2>
          </div>
          <Link href="/shop" className="font-semibold text-gum hover:underline">
            View all →
          </Link>
        </div>
        <ProductGrid products={bestsellers} />
      </section>

      {/* ── A note from the founders ─────────────────────── */}
      <section className="bg-sand">
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 md:grid-cols-[1fr_1.3fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rotate-[-3deg] rounded-md bg-white p-3 pb-14 shadow-xl">
              <div className="aspect-square overflow-hidden">
                <TextileArt category="towels" collection="bath-towels" pattern="plain" colour="#A3B09A" accent="#F3F1EA" view="alt" alt="A stack of Sage towels with a eucalyptus sprig" />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center font-hand text-2xl text-muted">the very first batch</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">A note from us</p>
            <h2 className="text-3xl sm:text-4xl">Hi, we&apos;re {store.founders.names}.</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#463f39]">{store.founders.note}</p>
            <p className="mt-4 text-lg leading-relaxed text-[#463f39]">
              We pack every order ourselves, and if you ask us to write a note for someone, we write it by hand. That
              bit never gets old.
            </p>
            <p className="mt-6 font-hand text-4xl text-gum">{store.founders.signOff.split(",")[0]} x</p>
            <Link href="/about" className="btn btn-outline mt-6">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* ── Colours of home ──────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-2">Colours of home</p>
          <h2 className="text-3xl sm:text-4xl">Every shade is named after somewhere we love</h2>
        </div>
        <ul className="grid grid-cols-4 gap-4 sm:gap-6 lg:grid-cols-8">
          {PALETTE.map((c) => (
            <li key={c.name}>
              <Link href={`/shop?colour=${encodeURIComponent(c.name)}`} className="group block text-center">
                <span
                  className="mx-auto block aspect-square w-full max-w-24 rounded-full border-4 border-white shadow-md transition group-hover:scale-105"
                  style={{ background: c.hex }}
                />
                <span className="mt-2 block text-sm font-semibold">{c.name}</span>
                <span className="text-muted hidden text-xs sm:block">{c.place}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Personalise ──────────────────────────────────── */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="grid overflow-hidden rounded-3xl bg-gum text-white md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-wattle">
              <Sparkles size={16} /> Make it theirs
            </p>
            <h2 className="text-3xl sm:text-4xl">Add a monogram to any towel</h2>
            <p className="mt-4 text-white/80">
              Up to three letters, embroidered in cream thread for {formatPrice(store.commerce.monogramCents)}. The
              wedding, housewarming and new-baby gift that actually gets used — add a handwritten note at checkout
              and we&apos;ll take care of the rest.
            </p>
            <Link href="/shop/towels" className="btn btn-light mt-8">
              Personalise a towel
            </Link>
          </div>
          <div className="relative min-h-72 bg-gum-dark">
            <TextileArt category="towels" collection="bath-towels" pattern="plain" colour="#D9C3A0" accent="#F7F1E6" alt="Sandstone towel with an embroidered monogram" />
            <span className="absolute left-1/2 top-[62%] -translate-x-1/2 font-serif text-4xl tracking-[0.3em] text-[#fbf7ef] drop-shadow-sm" aria-hidden>
              M&amp;S
            </span>
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="bg-white">
          <div className="container-page py-16 sm:py-20">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="eyebrow mb-2">Kind words</p>
              <h2 className="text-3xl sm:text-4xl">From homes all over Australia</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-line bg-cream p-6">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-4 flex-1">
                    <p className="font-serif text-lg">“{r.title}”</p>
                    <p className="text-muted mt-2">{r.body}</p>
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold">{r.name}</span>
                    {r.location && <span className="text-muted">, {r.location}</span>}
                    <Link href={`/products/${r.product.slug}`} className="mt-1 block text-gum hover:underline">
                      {r.product.name}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New in ───────────────────────────────────────── */}
      {fresh.length > 0 && (
        <section className="container-page py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Just landed</p>
              <h2 className="text-3xl sm:text-4xl">New in</h2>
            </div>
            <Link href="/shop?sort=newest" className="font-semibold text-gum hover:underline">
              View all →
            </Link>
          </div>
          <ProductGrid products={fresh} />
        </section>
      )}
    </>
  );
}
