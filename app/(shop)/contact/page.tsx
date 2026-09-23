import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/ui";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Questions about an order, a product or a return? Get in touch with the ${store.name} team.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { order, product } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Say g'day"
        title="We'd love to hear from you"
        intro={`Real people answer every message — usually ${store.founders.names} themselves. We reply within one business day.`}
      />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_22rem]">
        <ContactForm orderRef={typeof order === "string" ? order : undefined} message={typeof product === "string" ? product : undefined} />
        <aside className="space-y-6">
          <ul className="space-y-5 rounded-3xl bg-sand p-6">
            <li className="flex gap-3">
              <Mail className="mt-0.5 shrink-0 text-gum" size={20} />
              <span>
                <span className="block font-semibold">Email</span>
                <a href={`mailto:${store.email}`} className="underline underline-offset-4">{store.email}</a>
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 shrink-0 text-gum" size={20} />
              <span>
                <span className="block font-semibold">Phone</span>
                <a href={store.phoneHref} className="underline underline-offset-4">{store.phone}</a>
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-gum" size={20} />
              <span>
                <span className="block font-semibold">Hours</span>
                {store.hours}
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 shrink-0 text-gum" size={20} />
              <span>
                <span className="block font-semibold">Studio (not a shopfront)</span>
                {store.address.street}, {store.address.suburb} {store.address.state} {store.address.postcode}
              </span>
            </li>
          </ul>
          <div className="rounded-3xl border border-line p-6 text-sm">
            <p className="font-semibold">Quick answers</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/order-status" className="underline underline-offset-4">Where&apos;s my order?</Link></li>
              <li><Link href="/returns" className="underline underline-offset-4">How do I return something?</Link></li>
              <li><Link href="/shipping" className="underline underline-offset-4">How long does delivery take?</Link></li>
              <li><Link href="/faq" className="underline underline-offset-4">All FAQs</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
