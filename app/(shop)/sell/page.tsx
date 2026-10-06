import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/money";
import { percent } from "@/lib/marketplace";
import { store } from "@/lib/store";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = {
  title: "Sell with us",
  description: `Independent Australian makers can sell bath, bedding, rug and leather products through ${store.name}.`,
  alternates: { canonical: "/sell" },
};

const commission = percent(store.marketplace.defaultCommissionBps);
const hold = store.marketplace.payoutHoldDays;

export default function SellPage() {
  return (
    <div className="page-x py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="caps text-grey">Sell with {store.name}</p>
        <h1 className="wide mt-3 text-4xl md:text-[52px]">Sell your work alongside ours</h1>
        <p className="mt-6 text-[17px] leading-relaxed text-[#3b3a38]">
          We stock a small range of bath, bedding, rugs and leather. We also sell pieces from independent Australian makers and small
          brands whose work fits alongside it. You keep making and posting; we look after the shop, the customers and the payments.
        </p>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <section>
          <h2 className="text-2xl">How it works</h2>
          <ol className="mt-6 space-y-6 text-[15px] leading-relaxed">
            {[
              ["Apply", "Fill in the form on this page. We look at every application ourselves and reply within a week."],
              [
                "List your products",
                "Once approved, you get a login to the seller portal. Add products with your own photos, prices and stock. We check each listing before it goes live, so the shop stays consistent.",
              ],
              [
                "Ship your orders",
                "When something sells, you get an email with the items and the delivery address. Pack and post it within your dispatch time, then add the tracking number. The customer is emailed automatically.",
              ],
              [
                "Get paid",
                `We take the payment from the customer and pay you ${store.marketplace.payoutSchedule}. Each sale becomes payable ${hold} days after you ship it, which covers change-of-mind returns.`,
              ],
            ].map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="text-brass text-lg">{i + 1}</span>
                <span>
                  <span className="block text-ink">{title}</span>
                  <span className="text-grey">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-2xl">Fees</h2>
          <dl className="mt-6 divide-y divide-line border-y border-line text-[15px]">
            {[
              ["Commission", `${commission} of the product price, including any personalisation. Only charged when something sells.`],
              ["Listing or monthly fees", "None."],
              [
                "Delivery",
                `Customers pay our standard delivery rates, free on parcels over ${formatPrice(store.commerce.freeShippingThresholdCents)}. Whatever the customer pays for delivery on your parcel is passed to you in full, with no commission; you pay the actual postage.`,
              ],
              ["Discount codes", "Funded by us. You're paid on the full price even when a customer uses a code."],
              ["Refunds", "If an order is refunded, the sale and the commission on it are both reversed from your balance."],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="text-ink">{k}</dt>
                <dd className="text-grey">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12 text-2xl">What we look for</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-[15px] text-grey">
            <li>Products that sit in our categories: bath, bedding, rugs and leather goods.</li>
            <li>Made well, and described exactly as they are, including materials and where they&apos;re made.</li>
            <li>Your own photos of the actual product.</li>
            <li>An ABN, and stock you can post within a few business days, anywhere in Australia.</li>
          </ul>
          <p className="mt-5 text-[14px] text-grey">
            Read the full{" "}
            <Link href="/sell/terms" className="link text-ink">
              seller terms
            </Link>{" "}
            before you apply.
          </p>
        </section>
      </div>

      <section className="mt-20 max-w-3xl border-t border-line pt-14" id="apply">
        <h2 className="text-3xl">Apply to sell</h2>
        <p className="mt-3 mb-10 text-grey">It takes about five minutes. Nothing is charged.</p>
        <ApplyForm />
      </section>
    </div>
  );
}
