import type { Metadata } from "next";
import Link from "next/link";

import { TextileArt } from "@/components/TextileArt";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Our story",
  description: `How ${store.name} started at a kitchen table, and what we care about.`,
  alternates: { canonical: "/about" },
};

// TODO: this page is the heart of the brand — rewrite it in your own voice.
const VALUES = [
  {
    title: "We use it first",
    body: "Nothing goes in the shop until it has lived in our house for a season — through beach days, school runs and a very enthusiastic kelpie.",
  },
  {
    title: "Fewer, better things",
    body: "We'd rather sell you one towel that lasts ten years than three that go scratchy by Easter. Our range is small on purpose.",
  },
  {
    title: "Honest about materials",
    body: "Every product page says exactly what it's made of and how to look after it. If something sheds, pills or shrinks a little, we'll tell you.",
  },
  {
    title: "Packed by hand",
    body: "We pack every order ourselves in recycled and recyclable packaging — no plastic mailers, and a handwritten note whenever you want one.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-sand">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="text-5xl leading-tight sm:text-6xl">It started with a scratchy towel.</h1>
            <p className="mt-6 text-lg leading-relaxed text-[#463f39]">{store.founders.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-lg">
              <TextileArt category="towels" collection="beach-towels" pattern="fouta" colour="#B5563C" accent="#F6E9DF" alt="A fringed Byron fouta towel" />
            </div>
            <div className="mt-12 aspect-[4/5] overflow-hidden rounded-3xl shadow-lg">
              <TextileArt category="rugs" collection="area-rugs" pattern="border" colour="#C8A874" accent="#3B3A36" view="alt" alt="A jute rug in a living room" />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page max-w-3xl py-16 text-lg leading-relaxed text-[#463f39] sm:py-20">
        <p>
          It was the summer of beach days and too many sandy car trips. Our towels were thin, scratchy, and somehow
          always damp. So we went looking for better ones — and found that &ldquo;better&rdquo; usually meant hotel-grade
          prices or overseas shipping.
        </p>
        <p className="mt-5">
          We ordered samples from mills we trusted, washed them fifty times, dried them on the Hills Hoist and argued
          about them over dinner. The few that survived became the first {store.name} range. Rugs came next, after one
          too many muddy paws on a pale carpet.
        </p>
        <p className="mt-5">
          Today we&apos;re still a tiny team. We still answer every email ourselves, and we still get a little thrill
          every time someone sends us a photo of their towel at the beach.
        </p>
        <p className="mt-8 font-hand text-4xl text-gum">{store.founders.signOff}</p>
      </section>

      <section className="bg-white">
        <div className="container-page py-16 sm:py-20">
          <h2 className="mb-10 text-center text-3xl sm:text-4xl">What we care about</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <div key={v.title} className="rounded-3xl bg-cream p-6">
                <span className="font-serif text-4xl text-wattle">0{i + 1}</span>
                <h3 className="mt-3 text-xl">{v.title}</h3>
                <p className="text-muted mt-2">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 text-center sm:py-20">
        <h2 className="text-3xl sm:text-4xl">Come and have a look around</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop/towels" className="btn btn-primary">Shop towels</Link>
          <Link href="/shop/rugs" className="btn btn-outline">Shop rugs</Link>
        </div>
      </section>
    </>
  );
}
