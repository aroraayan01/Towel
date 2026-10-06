import Link from "next/link";

import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/collections";
import { store } from "@/lib/store";
import { Wordmark } from "./Logo";

const COLUMNS = [
  {
    title: "Shop",
    links: [...CATEGORY_ORDER.map((c) => [CATEGORIES[c].name, `/shop/${c}`] as const), ["New arrivals", "/shop?sort=newest"] as const],
  },
  {
    title: "Help",
    links: [
      ["Delivery", "/shipping"],
      ["Returns", "/returns"],
      ["Track an order", "/order-status"],
      ["Care guide", "/care-guide"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
    ] as const,
  },
  {
    title: "xomexo",
    links: [
      ["About", "/about"],
      ["Our makers", "/makers"],
      ["Sell with us", "/sell"],
      ["Instagram", `https://instagram.com/${store.instagram}`],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ] as const,
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-forest text-white/75">
      <div className="page-x grid gap-14 py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <div className="max-w-md">
          <h2 className="text-[28px] text-white">10% off your first order</h2>
          <p className="mt-3 mb-6 text-[14px]">New arrivals and restocks, about once a month.</p>
          <NewsletterForm tone="dark" />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="caps mb-4 !font-sans text-brass">{col.title}</h2>
              <ul className="space-y-2 text-[14px]">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="hover-line hover:text-white">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="hover-line hover:text-white">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-x flex flex-col justify-between gap-8 py-10 md:flex-row md:items-end">
          <div>
            <Wordmark className="text-white" tone="dark" />
            <p className="mt-5 max-w-2xl text-[13px] text-white/60">
              We acknowledge the Traditional Custodians of the land on which we work, {store.traditionalCustodians}, and pay our
              respects to Elders past and present.
            </p>
          </div>
          <div className="text-[12px] text-white/55 md:text-right">
            <p>Visa · Mastercard · Amex · Apple Pay · Google Pay{store.commerce.afterpay.enabled && " · Afterpay"}</p>
            <p className="mt-1">
              © {new Date().getFullYear()} {store.legalName} · ABN {store.abn} · Prices in AUD incl. GST
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
