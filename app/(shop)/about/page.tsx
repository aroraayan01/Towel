import type { Metadata } from "next";
import Link from "next/link";

import { Photo } from "@/components/Photo";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "About",
  description: `${store.name} makes a small range of towels and rugs, designed in ${store.address.suburb}.`,
  alternates: { canonical: "/about" },
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

// TODO: this page should be in your own words, with your own photos. The text
// below is a neutral starting point, not a story.
export default function AboutPage() {
  return (
    <>
      <section className="relative h-[60svh] max-h-[640px] min-h-[380px]">
        <Photo src={u("1783066070372-a1b0fffb7c53")} alt="Folded towels in afternoon light" sizes="100vw" preload />
        <div className="absolute inset-0 bg-black/30" />
        <div className="page-x absolute inset-x-0 bottom-0 pb-10 text-white md:pb-14">
          <h1 className="wide text-4xl md:text-6xl">About {store.name}</h1>
        </div>
      </section>

      <section className="page-x grid gap-10 py-16 md:grid-cols-[1fr_1.4fr] md:gap-20 md:py-24">
        <p className="caps text-grey">What we do</p>
        <div className="max-w-2xl space-y-5 text-[17px] leading-relaxed text-[#3b3a38]">
          <p className="text-2xl leading-snug text-ink md:text-[28px]">
            We make a small range of towels and rugs, and we use every one of them at home before it goes on sale.
          </p>
          <p>
            We started {store.name} because we couldn&apos;t find towels that were heavy enough to feel good, light enough to
            dry overnight, and priced like something you&apos;d actually use every day. Rugs came next, for the same reasons.
          </p>
          <p>
            We work with a handful of mills and weavers, order in small runs, and restock what people keep coming back for.
            Materials and care instructions are on every product page, including the less flattering details, like jute
            shedding a little and waffle towels shrinking on the first wash.
          </p>
          <p>
            Orders are packed by us in {store.address.suburb} {store.address.state} and sent Australia-wide. If something
            isn&apos;t right, <Link href="/contact" className="link">get in touch</Link> and we&apos;ll fix it.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="relative aspect-[4/5] md:aspect-[5/6]">
          <Photo src={u("1684248655527-46bee8e79029")} alt="Rolled Turkish towels with knotted fringes" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="relative aspect-[4/5] md:aspect-[5/6]">
          <Photo src={u("1762758889413-64d717f81b0d")} alt="Round jute rug on a timber floor" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      </section>

      <section className="page-x grid gap-10 py-16 md:grid-cols-3 md:py-24">
        {[
          ["Natural fibres", "Cotton towels. Jute, wool and cotton rugs. When something isn't, like our shag rug or foam bath mat, the product page says so."],
          ["Made to last", "Double-stitched hems, dense weaves and colours that are dyed in the yarn, not printed on."],
          ["Easy returns", `${store.commerce.returnDays} days to change your mind, and faulty items are always covered.`],
        ].map(([t, b]) => (
          <div key={t} className="border-t border-ink pt-5">
            <h2 className="text-[17px]">{t}</h2>
            <p className="mt-2 text-grey">{b}</p>
          </div>
        ))}
      </section>
    </>
  );
}
