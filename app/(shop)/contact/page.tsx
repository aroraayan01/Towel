import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/forms/ContactForm";
import { PageTitle } from "@/components/ui";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions about an order, a product or a return? Get in touch with ${store.name}.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { order, product } = await searchParams;
  return (
    <>
      <PageTitle title="Contact" intro="We reply within one business day." />
      <div className="page-x grid gap-14 pb-24 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
        <ContactForm orderRef={typeof order === "string" ? order : undefined} message={typeof product === "string" ? product : undefined} />
        <aside className="space-y-8 text-[14px]">
          <dl className="space-y-5">
            <div>
              <dt className="caps text-grey">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${store.email}`} className="link">
                  {store.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="caps text-grey">Phone</dt>
              <dd className="mt-1">
                <a href={store.phoneHref}>{store.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="caps text-grey">Hours</dt>
              <dd className="mt-1">{store.hours}</dd>
            </div>
            <div>
              <dt className="caps text-grey">Address</dt>
              <dd className="mt-1">
                {store.address.street}
                <br />
                {store.address.suburb} {store.address.state} {store.address.postcode}
                <br />
                <span className="text-grey">Warehouse only. No walk-in visits.</span>
              </dd>
            </div>
          </dl>
          <div className="border-t border-line pt-6">
            <p className="caps text-grey">Common questions</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/order-status" className="link">Where is my order?</Link></li>
              <li><Link href="/returns" className="link">How do I return something?</Link></li>
              <li><Link href="/shipping" className="link">How long does delivery take?</Link></li>
              <li><Link href="/faq" className="link">All FAQs</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
