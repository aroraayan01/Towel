import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { formatPrice } from "@/lib/money";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Delivery, returns, product care, monogramming and payment questions.",
  alternates: { canonical: "/faq" },
};

const free = formatPrice(store.commerce.freeShippingThresholdCents);

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Orders and delivery",
    items: [
      ["How much is delivery?", `Standard delivery is ${formatPrice(995)} to most of Australia and ${formatPrice(1495)} to WA, NT and TAS. It's free on orders over ${free}. Express delivery is available at checkout.`],
      ["How long does delivery take?", "Orders leave us within 1 to 2 business days. Standard delivery then takes 2 to 4 business days to east-coast capitals and up to 9 business days to regional and remote areas. Monogrammed items take 2 to 3 business days longer."],
      ["Do you ship overseas?", "Not at the moment. We only deliver within Australia."],
      ["Can I change or cancel my order?", "Yes, if it hasn't been packed yet. Contact us as soon as you can with your order number."],
      ["Where is my order?", "You'll receive a tracking number by email when your order ships. You can also check its status on the Track an order page."],
    ],
  },
  {
    title: "Returns",
    items: [
      ["What is your returns policy?", `Unused items in their original condition can be returned within ${store.commerce.returnDays} days for a refund or exchange. Faulty items are covered under the Australian Consumer Law.`],
      ["Can I return a monogrammed towel?", "Personalised items can't be returned for change of mind. If there's a fault, or we got the letters wrong, we'll replace it."],
    ],
  },
  {
    title: "Products and care",
    items: [
      ["Why is my new towel leaving lint?", "Loose fibres from weaving wash out in the first two or three washes. Wash new towels separately and skip the fabric softener."],
      ["Why is my rug shedding?", "New wool and jute rugs shed loose fibres for the first few months. Vacuum regularly, without the beater bar, and it settles."],
      ["Do I need an underlay?", "On timber, tile or polished concrete, yes. It stops the rug slipping, protects the floor and makes the rug last longer."],
      ["Are the photos accurate?", "Colours vary a little between screens. If you're unsure, email us and we'll send a photo in daylight."],
    ],
  },
  {
    title: "Payment",
    items: [
      ["How can I pay?", `Visa, Mastercard, American Express, Apple Pay and Google Pay${store.commerce.afterpay.enabled ? ", or Afterpay" : ""}. Payments are processed by Stripe and we never see your card details.`],
      ["Are prices in Australian dollars?", "Yes. All prices are in AUD and include GST. Your confirmation email is a tax invoice."],
      ["Do you have a discount code?", `Sign up to our mailing list for ${store.commerce.welcomeCode}, 10% off your first order.`],
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUPS.flatMap((g) => g.items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageTitle title="FAQ" />
      <div className="page-x grid gap-12 pb-24 lg:grid-cols-[1fr_2fr]">
        <p className="text-grey lg:max-w-xs">
          Can&apos;t find the answer? <Link href="/contact" className="link text-ink">Contact us</Link> and we&apos;ll reply within one business day.
        </p>
        <div className="space-y-12">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h2 className="caps mb-2 text-grey">{g.title}</h2>
              <div className="border-t border-line">
                {g.items.map(([q, a]) => (
                  <details key={q} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                      {q}
                      <span className="text-lg leading-none transition group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-5 text-grey">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
