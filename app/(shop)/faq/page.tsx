import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { PageHeader } from "@/components/ui";
import { formatPrice } from "@/lib/money";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about shipping, returns, products, monogramming and payments.",
  alternates: { canonical: "/faq" },
};

const free = formatPrice(store.commerce.freeShippingThresholdCents);

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Orders & delivery",
    items: [
      ["How much is shipping?", `Standard delivery is ${formatPrice(995)} to most of Australia (${formatPrice(1495)} to WA, NT and TAS) and free on orders over ${free}. Express delivery is also available at checkout.`],
      ["How long will my order take?", "We pack orders within 1–2 business days. Standard delivery then takes 2–4 business days to capital cities on the east coast and up to 9 business days to regional and remote areas. Monogrammed items take an extra 2–3 business days."],
      ["Do you ship internationally?", "Not yet — we only deliver within Australia for now. New Zealand is next on our list."],
      ["Can I change or cancel my order?", "If it hasn't been packed yet, absolutely. Contact us as soon as possible with your order number and we'll sort it out."],
      ["Where's my order?", "You'll get an email with tracking as soon as your order ships. You can also check its status any time on our Track an order page."],
    ],
  },
  {
    title: "Returns",
    items: [
      ["What's your returns policy?", `You can return unused items in their original condition within ${store.commerce.returnDays} days for a refund or exchange. Faulty items are always covered under the Australian Consumer Law.`],
      ["Can I return a monogrammed towel?", "Because they're made just for you, personalised items can't be returned for a change of mind. If there's a fault or we made a mistake with your letters, we'll make it right."],
    ],
  },
  {
    title: "Products & care",
    items: [
      ["Why is my new towel shedding lint?", "Totally normal for thick cotton towels. Loose fibres from the weaving process wash out in the first two or three washes. Wash separately at first and skip the fabric softener."],
      ["Why is my wool rug shedding?", "New wool rugs shed loose fibres for the first few months. Vacuum regularly (without the beater bar) and it will settle down."],
      ["Do I need a rug underlay?", "On timber, tile or polished concrete, yes — an underlay stops slipping, protects the floor and makes the rug feel thicker underfoot."],
      ["Are the colours accurate?", "We do our best, but screens vary. If you're unsure, contact us and we'll describe the colour or send a photo in natural light."],
    ],
  },
  {
    title: "Payment",
    items: [
      ["What payment methods do you accept?", `Visa, Mastercard, American Express, Apple Pay, Google Pay${store.commerce.afterpay.enabled ? " and Afterpay" : ""}. Payments are processed securely by Stripe — we never see or store your card details.`],
      ["Are prices in Australian dollars?", "Yes. All prices are in AUD and include GST. Your confirmation email is a tax invoice."],
      ["Do you have discount codes?", `Sign up to our newsletter and we'll give you ${store.commerce.welcomeCode} for 10% off your first order.`],
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUPS.flatMap((g) =>
      g.items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader eyebrow="Help" title="Frequently asked questions" intro="Can't find what you're after? Just ask — we're friendly." />
      <div className="container-page max-w-3xl py-12">
        {GROUPS.map((g) => (
          <section key={g.title} className="mb-10">
            <h2 className="mb-4 text-2xl">{g.title}</h2>
            <div className="divide-y divide-line rounded-2xl border border-line bg-white">
              {g.items.map(([q, a]) => (
                <details key={q} className="group px-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-5 text-[#463f39]">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="rounded-2xl bg-sand p-6 text-center">
          Still stuck? <Link href="/contact" className="font-semibold underline">Send us a message</Link> and a real person will reply within one business day.
        </p>
      </div>
    </>
  );
}
