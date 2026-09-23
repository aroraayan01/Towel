import type { Metadata } from "next";

import { PolicyPage } from "@/components/PolicyPage";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${store.name} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

// TODO: have this reviewed before launch. It is written to follow the
// Australian Privacy Principles, but it's a template, not legal advice.
export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy" intro="We collect what we need to deliver your order, and we never sell your data." updated="23 September 2026">
      <p>
        {store.legalName} (ABN {store.abn}) (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This policy explains how
        we handle personal information in line with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
        Principles.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>When you order:</strong> your name, email, phone number (optional), delivery address and what you bought.
        </li>
        <li>
          <strong>When you contact us or leave a review:</strong> your name, email and what you tell us.
        </li>
        <li>
          <strong>When you join our newsletter:</strong> your email address.
        </li>
        <li>
          <strong>Payment details:</strong> we don&apos;t collect or store card numbers. Payments are handled by Stripe
          {store.commerce.afterpay.enabled && " (and Afterpay, if you choose it)"}, who process them under their own
          privacy policies and PCI-DSS security standards.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>to process, deliver and support your order, including sending order and shipping emails</li>
        <li>to answer your questions and handle returns</li>
        <li>to send marketing emails, only if you&apos;ve opted in, with an unsubscribe link in every email</li>
        <li>to prevent fraud and meet our legal obligations (for example, keeping tax records)</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We share only what&apos;s needed with the businesses that help us run the shop: our payment processor (Stripe),
        delivery carriers (such as Australia Post), our email provider and our website host. Some of these providers may
        store data outside Australia (for example, in the United States). We never sell or rent your personal information.
      </p>

      <h2>Cookies &amp; local storage</h2>
      <p>
        We use your browser&apos;s local storage to remember your cart and wishlist between visits. We don&apos;t use
        advertising or tracking cookies. If you clear your browser data, your cart will be emptied.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Our site uses HTTPS encryption, access to order information is restricted to our team, and we keep personal
        information only as long as we need it (order records are kept for 5 years for tax purposes).
      </p>

      <h2>Accessing or correcting your information</h2>
      <p>
        You can ask to see, correct or delete the personal information we hold about you by emailing{" "}
        <a href={`mailto:${store.email}`}>{store.email}</a>. We&apos;ll respond within 30 days.
      </p>

      <h2>Complaints</h2>
      <p>
        If you&apos;re worried about how we&apos;ve handled your information, please contact us first and we&apos;ll do our
        best to fix it. If you&apos;re not satisfied, you can contact the Office of the Australian Information Commissioner
        at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">oaic.gov.au</a>.
      </p>
    </PolicyPage>
  );
}
