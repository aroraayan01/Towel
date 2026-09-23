import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/PolicyPage";
import { formatMoney, formatPrice } from "@/lib/money";
import { shippingQuote } from "@/lib/shipping";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Shipping & delivery",
  description: `Delivery costs and timeframes across Australia. Free standard shipping on orders over ${formatPrice(store.commerce.freeShippingThresholdCents)}.`,
  alternates: { canonical: "/shipping" },
};

const ZONES = [
  { name: "NSW, VIC & ACT", state: "NSW" as const },
  { name: "QLD & SA", state: "QLD" as const },
  { name: "WA, TAS & NT", state: "WA" as const },
];

export default function ShippingPage() {
  return (
    <PolicyPage title="Shipping & delivery" intro="We deliver Australia-wide from our warehouse, tracked all the way to your door.">
      <h2>Delivery costs &amp; timeframes</h2>
      <p>
        Standard delivery is <strong>free on orders over {formatPrice(store.commerce.freeShippingThresholdCents)}</strong> (after
        discounts). Timeframes are in business days after your order leaves us.
      </p>
      <table>
        <thead>
          <tr>
            <th>Where</th>
            <th>Standard</th>
            <th>Express</th>
          </tr>
        </thead>
        <tbody>
          {ZONES.map((z) => {
            const s = shippingQuote("standard", z.state, 0);
            const e = shippingQuote("express", z.state, 0);
            return (
              <tr key={z.name}>
                <td>{z.name}</td>
                <td>
                  {formatMoney(s.cents)} · {s.eta}
                </td>
                <td>
                  {formatMoney(e.cents)} · {e.eta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>Regional and remote addresses can take a few days longer than the estimates above.</p>

      <h2>When will my order ship?</h2>
      <p>
        We pack orders within 1–2 business days (Monday to Friday, excluding public holidays). Monogrammed items need an
        extra 2–3 business days while we embroider them. You&apos;ll get an email with your tracking number as soon as
        your parcel leaves us.
      </p>

      <h2>Big rugs</h2>
      <p>
        Larger rugs are rolled and shipped by courier rather than Australia Post, and may need a signature on delivery.
        If you won&apos;t be home, add a safe-place note in the second address line at checkout.
      </p>

      <h2>PO Boxes &amp; parcel lockers</h2>
      <p>Towels and bath mats can go to PO Boxes and Parcel Lockers. Rugs are too big — please use a street address.</p>

      <h2>International</h2>
      <p>We only ship within Australia at the moment.</p>

      <h2>Something wrong with your delivery?</h2>
      <p>
        If your tracking hasn&apos;t moved in a few days or your parcel arrives damaged, <Link href="/contact">get in touch</Link>{" "}
        and we&apos;ll chase it up with the carrier for you. You won&apos;t be left out of pocket for a parcel lost in transit.
      </p>
    </PolicyPage>
  );
}
