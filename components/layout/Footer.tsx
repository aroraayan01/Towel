import Link from "next/link";

import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { store } from "@/lib/store";
import { Wordmark } from "./Logo";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      ["Bath towels", "/shop/bath-towels"],
      ["Beach towels", "/shop/beach-towels"],
      ["Hand towels", "/shop/hand-towels"],
      ["Rugs", "/shop/area-rugs"],
      ["Runners", "/shop/runners"],
      ["Bath mats", "/shop/bath-mats"],
    ],
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
    ],
  },
  {
    title: store.name,
    links: [
      ["About", "/about"],
      ["Instagram", `https://instagram.com/${store.instagram}`],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="page-x grid gap-12 py-14 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <div className="max-w-md">
          <h2 className="text-xl">10% off your first order</h2>
          <p className="mt-2 mb-5 text-grey">Join the mailing list for new colours and restocks. We email about once a month.</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="caps mb-4 text-grey">{col.title}</h2>
              <ul className="space-y-2 text-[14px]">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="hover-line">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="hover-line">
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

      <div className="page-x border-t border-line py-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-2xl text-[13px] text-grey">
              We acknowledge the Traditional Custodians of the land on which we work, {store.traditionalCustodians}, and pay our
              respects to Elders past and present.
            </p>
          </div>
          <div className="text-[12px] text-grey md:text-right">
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
