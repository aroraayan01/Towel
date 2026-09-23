"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { CATEGORIES, COLLECTIONS, type Category } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { store } from "@/lib/store";
import { Wordmark } from "./Logo";

const NAV: { cat: Category; label: string }[] = [
  { cat: "towels", label: "Towels" },
  { cat: "rugs", label: "Rugs & mats" },
];

export function Header() {
  const { count, setOpen, wishlist, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState<Category | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    setSearchOpen(false);
    setPanel(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="bg-ink text-white">
        <p className="page-x caps py-2 text-center !text-[11px]">
          Free delivery over {formatPrice(store.commerce.freeShippingThresholdCents)}
          <span className="mx-3 opacity-50">|</span>
          {store.commerce.returnDays}-day returns
          <span className="hidden sm:inline">
            <span className="mx-3 opacity-50">|</span>Afterpay available
          </span>
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white" onMouseLeave={() => setPanel(null)}>
        <div className="page-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[72px]">
          <div className="flex items-center">
            <button className="-ml-2 grid size-10 place-items-center lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <button className="grid size-10 place-items-center lg:hidden" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
              <Search size={19} strokeWidth={1.5} />
            </button>
            <nav className="hidden items-center gap-7 text-[14px] lg:flex" aria-label="Main">
              {NAV.map((n) => (
                <Link
                  key={n.cat}
                  href={`/shop/${n.cat}`}
                  className={`hover-line py-1 ${panel === n.cat ? "!bg-[length:100%_1px]" : ""}`}
                  onMouseEnter={() => setPanel(n.cat)}
                  onFocus={() => setPanel(n.cat)}
                  aria-expanded={panel === n.cat}
                >
                  {n.label}
                </Link>
              ))}
              <Link href="/shop?sort=newest" className="hover-line py-1" onMouseEnter={() => setPanel(null)}>
                New in
              </Link>
              <Link href="/about" className="hover-line py-1" onMouseEnter={() => setPanel(null)}>
                About
              </Link>
            </nav>
          </div>

          <Link href="/" aria-label={`${store.name} home`}>
            <Wordmark />
          </Link>

          <div className="flex items-center justify-end gap-5 text-[14px]">
            <button className="hidden hover-line py-1 lg:inline" onClick={() => setSearchOpen((s) => !s)} aria-expanded={searchOpen}>
              Search
            </button>
            <Link href="/wishlist" className="hidden hover-line py-1 lg:inline">
              Wishlist{ready && wishlist.length > 0 && ` (${wishlist.length})`}
            </Link>
            <button className="hidden hover-line py-1 lg:inline" onClick={() => setOpen(true)}>
              Cart ({ready ? count : 0})
            </button>
            <button className="relative -mr-2 grid size-10 place-items-center lg:hidden" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={19} strokeWidth={1.5} />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] text-white">{count}</span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop menu panel */}
        {panel && (
          <div className="animate-fade absolute inset-x-0 top-full hidden border-b border-line bg-white lg:block">
            <div className="page-x grid grid-cols-[1fr_1fr_1fr_1fr] gap-8 py-10">
              <div>
                <p className="caps mb-4 text-grey">{CATEGORIES[panel].name}</p>
                <ul className="space-y-2.5 text-[15px]">
                  {COLLECTIONS.filter((c) => c.category === panel).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/shop/${c.slug}`} className="hover-line">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2">
                    <Link href={`/shop/${panel}`} className="link">
                      Shop all
                    </Link>
                  </li>
                </ul>
              </div>
              {COLLECTIONS.filter((c) => c.category === panel).map((c) => (
                <Link key={c.slug} href={`/shop/${c.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-bone">
                    <Image src={c.image} alt="" fill sizes="25vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-2 text-[14px]">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {searchOpen && (
          <div className="animate-fade absolute inset-x-0 top-full border-b border-line bg-white">
            <form action="/shop" className="page-x flex items-center gap-3 py-5" role="search">
              <Search size={18} strokeWidth={1.5} className="shrink-0 text-grey" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search
              </label>
              <input id="site-search" name="q" type="search" autoFocus placeholder="Search towels, rugs, colours" className="h-10 w-full bg-transparent text-lg outline-none" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="shrink-0">
                <X size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Wordmark />
              <button onClick={() => setMenuOpen(false)} className="-mr-2 grid size-10 place-items-center" aria-label="Close menu">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex-1 px-5 py-6" aria-label="Mobile">
              {NAV.map((n) => (
                <div key={n.cat} className="mb-7">
                  <p className="caps mb-3 text-grey">{n.label}</p>
                  <ul className="space-y-3 text-[17px]">
                    {COLLECTIONS.filter((c) => c.category === n.cat).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/shop/${c.slug}`}>{c.name}</Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/shop/${n.cat}`} className="link">
                        Shop all
                      </Link>
                    </li>
                  </ul>
                </div>
              ))}
              <ul className="space-y-3 border-t border-line pt-6 text-[15px]">
                <li><Link href="/shop?sort=newest">New in</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/wishlist">Wishlist{ready && wishlist.length > 0 && ` (${wishlist.length})`}</Link></li>
                <li><Link href="/order-status">Track an order</Link></li>
                <li><Link href="/faq">Help</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
