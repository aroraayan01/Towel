import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/PolicyPage";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: `The terms that apply when you shop with ${store.name}.`,
  alternates: { canonical: "/terms" },
};

// TODO: have these reviewed before launch — a template, not legal advice.
export default function TermsPage() {
  return (
    <PolicyPage title="Terms & conditions" updated="23 September 2026">
      <p>
        These terms apply when you use this website or buy from {store.legalName} (ABN {store.abn}). Nothing in these terms
        excludes, restricts or modifies any right or remedy you have under the Australian Consumer Law.
      </p>

      <h2>Prices &amp; payment</h2>
      <p>
        All prices are in Australian dollars and include GST. Delivery charges are shown at checkout before you pay. We
        take reasonable care to keep prices accurate; if we make an obvious pricing error, we&apos;ll contact you before
        dispatching and give you the choice to proceed at the correct price or cancel for a full refund.
      </p>

      <h2>Orders</h2>
      <p>
        Your order is an offer to buy. A contract is formed when we confirm your order by email. We may cancel an order
        (with a full refund) if an item is unavailable or we suspect fraud.
      </p>

      <h2>Product information</h2>
      <p>
        We describe and show our products as accurately as we can. Because our towels and rugs are made from natural
        fibres, and many are made by hand, small variations in colour, size (usually within 3–5%) and texture are normal
        and are not faults. Screen colours may differ slightly from the real thing.
      </p>

      <h2>Personalised items</h2>
      <p>
        You&apos;re responsible for checking your monogram letters before ordering. Personalised items can&apos;t be
        returned for change of mind, but your consumer guarantee rights still apply.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery times are estimates. Risk in the goods passes to you on delivery. See our{" "}
        <Link href="/shipping">shipping page</Link> for details.
      </p>

      <h2>Returns</h2>
      <p>
        See our <Link href="/returns">returns policy</Link>.
      </p>

      <h2>Discount codes</h2>
      <p>
        Discount codes can&apos;t be combined, exchanged for cash, or applied to past orders. Welcome codes are limited to
        one use per customer.
      </p>

      <h2>Reviews</h2>
      <p>
        By submitting a review you confirm it reflects your genuine experience. We publish positive and negative reviews
        alike, and only remove reviews that are abusive, off-topic, or contain personal information.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of {store.address.state === "WA" ? "Western Australia" : "the state in which we operate"}.</p>
    </PolicyPage>
  );
}
