import Link from "next/link";

import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { store } from "@/lib/store";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      ["Bath towels", "/shop/bath-towels"],
      ["Beach towels", "/shop/beach-towels"],
      ["Hand towels", "/shop/hand-towels"],
      ["Area rugs", "/shop/area-rugs"],
      ["Runners", "/shop/runners"],
      ["Bath mats", "/shop/bath-mats"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Shipping & delivery", "/shipping"],
      ["Returns & exchanges", "/returns"],
      ["Track an order", "/order-status"],
      ["Care guide", "/care-guide"],
      ["FAQs", "/faq"],
      ["Contact us", "/contact"],
    ],
  },
  {
    title: "About",
    links: [
      ["Our story", "/about"],
      ["Wishlist", "/wishlist"],
      ["Privacy policy", "/privacy"],
      ["Terms & conditions", "/terms"],
    ],
  },
] as const;

const PAYMENTS = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", ...(store.commerce.afterpay.enabled ? ["Afterpay"] : [])];

export function Footer() {
  return (
    <footer className="mt-auto bg-gum-dark text-cream">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-md">
          <Logo light />
          <p className="mt-4 text-white/75">{store.description}</p>
          <h2 className="mt-8 font-serif text-xl">Join the family</h2>
          <p className="mt-1 mb-4 text-sm text-white/75">New colours, restocks and the odd beach-day giveaway.</p>
          <NewsletterForm dark />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 text-sm font-bold tracking-widest uppercase text-wattle">{col.title}</h2>
              <ul className="space-y-2.5 text-white/80">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white hover:underline underline-offset-4">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-3">
            <h2 className="mb-3 text-sm font-bold tracking-widest uppercase text-wattle">Say g&apos;day</h2>
            <p className="text-white/80">
              <a href={`mailto:${store.email}`} className="hover:underline">{store.email}</a>
              {" · "}
              <a href={store.phoneHref} className="hover:underline">{store.phone}</a>
              {" · "}
              {store.hours}
            </p>
            <p className="mt-3 flex gap-4 text-sm text-white/80">
              <a href={store.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
              <a href={store.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>
              <a href={store.social.pinterest} target="_blank" rel="noopener noreferrer" className="hover:underline">Pinterest</a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-8">
          <p className="max-w-3xl text-sm leading-relaxed text-white/70">
            We acknowledge the Traditional Custodians of the lands on which we live and work, and pay our respects to
            Elders past and present. Always was, always will be, Aboriginal land.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {store.legalName} · ABN {store.abn} · Proudly Australian owned · All prices in AUD and include GST
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <li key={p} className="rounded border border-white/20 px-2 py-1 font-semibold text-white/80">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
