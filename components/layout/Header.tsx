"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { CATEGORIES, CATEGORY_ORDER, COLLECTIONS, type Category } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { store } from "@/lib/store";
import { Wordmark } from "./Logo";

export function Header() {
  const { count, setOpen, wishlist, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState<Category | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the home page the header floats over the hero photo until you scroll
  const overlay = pathname === "/" && !scrolled && !panel && !searchOpen;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="bg-forest text-white/90">
        <p className="page-x caps py-2.5 text-center !text-[10.5px] !tracking-[0.14em]">
          Complimentary delivery over {formatPrice(store.commerce.freeShippingThresholdCents)}
          <span className="mx-3 text-brass">·</span>
          {store.commerce.returnDays}-day returns
          <span className="hidden sm:inline">
            <span className="mx-3 text-brass">·</span>Afterpay available
          </span>
        </p>
      </div>

      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          overlay ? "border-transparent bg-transparent text-white" : "border-line bg-white text-ink"
        }`}
        onMouseLeave={() => setPanel(null)}
      >
        <div className="page-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[76px]">
          <div className="flex items-center">
            <button className="-ml-2 grid size-10 place-items-center lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={20} strokeWidth={1.4} />
            </button>
            <button className="grid size-10 place-items-center lg:hidden" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
              <Search size={19} strokeWidth={1.4} />
            </button>
            <nav className="hidden items-center gap-8 text-[13px] tracking-[0.06em] uppercase lg:flex" aria-label="Main">
              {CATEGORY_ORDER.map((cat) => (
                <Link
                  key={cat}
                  href={`/shop/${cat}`}
                  className={`hover-line py-1 ${panel === cat ? "!bg-[length:100%_1px]" : ""}`}
                  onMouseEnter={() => setPanel(cat)}
                  onFocus={() => setPanel(cat)}
                  aria-expanded={panel === cat}
                >
                  {CATEGORIES[cat].name}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" aria-label={`${store.name} home`}>
            <Wordmark />
          </Link>

          <div className="flex items-center justify-end gap-6 text-[13px] tracking-[0.06em] uppercase">
            <Link href="/shop?sort=newest" className="hidden hover-line py-1 xl:inline">
              New
            </Link>
            <button className="hidden hover-line py-1 uppercase lg:inline" onClick={() => setSearchOpen((s) => !s)} aria-expanded={searchOpen}>
              Search
            </button>
            <Link href="/wishlist" className="hidden hover-line py-1 lg:inline">
              Saved{ready && wishlist.length > 0 && ` (${wishlist.length})`}
            </Link>
            <button className="hidden hover-line py-1 uppercase lg:inline" onClick={() => setOpen(true)}>
              Bag ({ready ? count : 0})
            </button>
            <button className="relative -mr-2 grid size-10 place-items-center lg:hidden" onClick={() => setOpen(true)} aria-label={`Bag, ${count} items`}>
              <ShoppingBag size={19} strokeWidth={1.4} />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-forest px-1 text-[10px] text-white">{count}</span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop menu panel */}
        {panel && (
          <div className="animate-fade absolute inset-x-0 top-full hidden border-b border-line bg-white text-ink lg:block">
            <div className="page-x grid grid-cols-[1fr_1fr_1fr_1fr] gap-8 py-10">
              <div>
                <p className="wide text-2xl">{CATEGORIES[panel].name}</p>
                <p className="mt-2 max-w-60 text-[13px] text-grey">{CATEGORIES[panel].blurb}</p>
                <ul className="mt-6 space-y-2.5 text-[15px]">
                  {COLLECTIONS.filter((c) => c.category === panel).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/shop/${c.slug}`} className="hover-line">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2">
                    <Link href={`/shop/${panel}`} className="link text-[13px]">
                      Shop all {CATEGORIES[panel].name.toLowerCase()}
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
          <div className="animate-fade absolute inset-x-0 top-full border-b border-line bg-white text-ink">
            <form action="/shop" className="page-x flex items-center gap-3 py-5" role="search">
              <Search size={18} strokeWidth={1.4} className="shrink-0 text-grey" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search
              </label>
              <input id="site-search" name="q" type="search" autoFocus placeholder="Search towels, quilts, leather…" className="h-10 w-full bg-transparent text-lg outline-none" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="shrink-0">
                <X size={20} strokeWidth={1.4} />
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
                <X size={20} strokeWidth={1.4} />
              </button>
            </div>
            <nav className="flex-1 px-5 py-6" aria-label="Mobile">
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat} className="mb-7">
                  <Link href={`/shop/${cat}`} className="wide text-[26px]">
                    {CATEGORIES[cat].name}
                  </Link>
                  <ul className="mt-2 space-y-2 text-[15px] text-grey">
                    {COLLECTIONS.filter((c) => c.category === cat).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/shop/${c.slug}`}>{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <ul className="space-y-3 border-t border-line pt-6 text-[15px]">
                <li><Link href="/shop?sort=newest">New arrivals</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/wishlist">Saved{ready && wishlist.length > 0 && ` (${wishlist.length})`}</Link></li>
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
