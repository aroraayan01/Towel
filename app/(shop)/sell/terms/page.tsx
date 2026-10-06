import type { Metadata } from "next";
import Link from "next/link";

import { percent } from "@/lib/marketplace";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Seller terms",
  alternates: { canonical: "/sell/terms" },
};

// TEMPLATE: have a lawyer review these before taking on sellers. They are a
// plain-English starting point that matches how the shop actually works.
export default function SellerTermsPage() {
  const commission = percent(store.marketplace.defaultCommissionBps);
  return (
    <div className="page-x py-12 md:py-20">
      <article className="prose-page max-w-3xl">
        <h1 className="wide text-4xl">Seller terms</h1>
        <p className="text-grey">
          These terms apply between {store.legalName} (ABN {store.abn}), which runs {store.name}, and each business approved to sell through it
          (&ldquo;you&rdquo;). By applying, you agree to them.
        </p>

        <h2>1. Your listings</h2>
        <ul>
          <li>Describe every product accurately, including materials, dimensions, where it&apos;s made and how to care for it.</li>
          <li>Use your own photos of the actual product. Don&apos;t use photos you don&apos;t have the rights to.</li>
          <li>
            Your products must meet Australian law, including the Australian Consumer Law and any mandatory product safety standards and
            labelling (for example, care labelling on textiles).
          </li>
          <li>We review each new product and each change to its description before it&apos;s shown. We can decline or remove any listing.</li>
          <li>You can change prices and stock at any time; those changes apply straight away.</li>
        </ul>

        <h2>2. Orders and delivery</h2>
        <ul>
          <li>Post each order within the dispatch time shown on your products, to the address we give you, and add the tracking number in the seller portal.</li>
          <li>Include the customer&apos;s gift note when there is one. Don&apos;t include prices or your own marketing material in gift orders.</li>
          <li>If you can&apos;t fulfil an order, tell us within one business day so we can refund the customer.</li>
          <li>Use the customer&apos;s details only to deliver their order. Don&apos;t add them to your own mailing lists.</li>
        </ul>

        <h2>3. Returns, refunds and faults</h2>
        <ul>
          <li>
            Customers can return items under our{" "}
            <Link href="/returns">returns policy</Link>, including change-of-mind returns within {store.commerce.returnDays} days. Returns of your
            products come back to your address.
          </li>
          <li>You&apos;re responsible for remedies under the Australian Consumer Law for faults in your products (repair, replacement or refund).</li>
          <li>When we refund an order, the sale is reversed from your balance and the commission on it is returned to you.</li>
        </ul>

        <h2>4. Fees and payment</h2>
        <ul>
          <li>
            We charge a commission of {commission} of the product price (including personalisation) on each sale, unless we&apos;ve agreed a
            different rate with you in writing. There are no listing or monthly fees.
          </li>
          <li>
            Customers pay us. We hold the money for your sales and pay you {store.marketplace.payoutSchedule}, to the bank account in your seller
            profile. A sale becomes payable {store.marketplace.payoutHoldDays} days after you mark it shipped.
          </li>
          <li>The delivery charge the customer paid for your parcel is passed to you in full. Discount codes are funded by us.</li>
          <li>If refunds leave your balance below zero, we&apos;ll deduct it from future payments, or ask you to repay it.</li>
          <li>Your statement in the seller portal shows every sale, commission, refund and payment.</li>
        </ul>

        <h2>5. Tax</h2>
        <ul>
          <li>You&apos;re the supplier of your products. Invoices to customers show your business name and ABN, and include GST only if you&apos;re registered for it.</li>
          <li>Keep your GST registration status up to date in your seller profile. You&apos;re responsible for your own GST and income tax.</li>
          <li>Our commission is a fee for our services to you{store.gstRegistered ? " and includes GST" : ""}.</li>
        </ul>

        <h2>6. Suspension and ending</h2>
        <ul>
          <li>You can stop selling at any time by emailing us. We&apos;ll pay out your balance once open orders and the return period have passed.</li>
          <li>
            We can suspend or end your account if you breach these terms, repeatedly ship late, receive serious complaints, or list products
            that are unsafe or misdescribed. Your products are hidden while your account is suspended.
          </li>
        </ul>

        <h2>7. Changes</h2>
        <p>We&apos;ll email you at least 30 days before changing these terms or your commission rate.</p>

        <p className="text-grey">
          Questions: <a href={`mailto:${store.email}`}>{store.email}</a>
        </p>
      </article>
    </div>
  );
}
