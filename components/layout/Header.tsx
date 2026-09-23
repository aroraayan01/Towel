"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { CATEGORIES, COLLECTIONS } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { store } from "@/lib/store";
import { Logo } from "./Logo";

const MESSAGES = [
  `Free standard shipping Australia-wide on orders over ${formatPrice(store.commerce.freeShippingThresholdCents)}`,
  `${store.commerce.returnDays}-day change-of-mind returns`,
  "Free handwritten gift notes on every order",
  store.commerce.afterpay.enabled ? "Shop now, pay later with Afterpay" : "Secure checkout",
];

export function Header() {
  const { count, setOpen, wishlist, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [msg, setMsg] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <div className="bg-gum text-center text-sm text-white">
        <p className="container-page py-2" aria-live="polite">
          {MESSAGES[msg]}
        </p>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-4 sm:h-20">
          <button className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-sand lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Link href="/" className="shrink-0" aria-label={`${store.name} home`}>
            <Logo />
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {(["towels", "rugs"] as const).map((cat) => (
              <div key={cat} className="group relative">
                <Link href={`/shop/${cat}`} className="flex items-center gap-1 rounded-full px-4 py-2 font-medium hover:bg-sand">
                  {CATEGORIES[cat].name}
                  <ChevronDown size={14} className="transition group-hover:rotate-180" aria-hidden />
                </Link>
                <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="w-64 rounded-2xl border border-line bg-white p-2 shadow-xl">
                    {COLLECTIONS.filter((c) => c.category === cat).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/shop/${c.slug}`} className="block rounded-xl px-3 py-2.5 hover:bg-sand">
                          <span className="block font-medium">{c.name}</span>
                          <span className="text-muted block text-xs">{c.blurb}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/shop/${cat}`} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gum hover:bg-sand">
                        Shop all {CATEGORIES[cat].name.toLowerCase()} →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
            <Link href="/shop?sort=newest" className="rounded-full px-4 py-2 font-medium hover:bg-sand">
              New in
            </Link>
            <Link href="/about" className="rounded-full px-4 py-2 font-medium hover:bg-sand">
              Our story
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button className="grid size-10 place-items-center rounded-full hover:bg-sand" onClick={() => setSearchOpen((s) => !s)} aria-label="Search" aria-expanded={searchOpen}>
              <Search size={20} />
            </button>
            <Link href="/wishlist" className="relative hidden size-10 place-items-center rounded-full hover:bg-sand sm:grid" aria-label={`Wishlist (${wishlist.length})`}>
              <Heart size={20} />
              {ready && wishlist.length > 0 && <Badge n={wishlist.length} />}
            </Link>
            <button className="relative grid size-10 place-items-center rounded-full hover:bg-sand" onClick={() => setOpen(true)} aria-label={`Open cart (${count} items)`}>
              <ShoppingBag size={20} />
              {ready && count > 0 && <Badge n={count} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-fade-in border-t border-line bg-cream">
            <form action="/shop" className="container-page flex gap-2 py-4" role="search">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input id="site-search" name="q" type="search" autoFocus placeholder="Search towels, rugs, colours…" className="field" />
              <button className="btn btn-primary">Search</button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade-in absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-cream">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-5 py-4" aria-label="Mobile">
              {(["towels", "rugs"] as const).map((cat) => (
                <div key={cat} className="mb-6">
                  <Link href={`/shop/${cat}`} className="font-serif text-2xl">
                    {CATEGORIES[cat].name}
                  </Link>
                  <ul className="mt-2 space-y-1">
                    {COLLECTIONS.filter((c) => c.category === cat).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/shop/${c.slug}`} className="text-muted block py-1.5 hover:text-ink">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <ul className="space-y-3 border-t border-line pt-5 font-medium">
                <li><Link href="/shop?sort=newest">New in</Link></li>
                <li><Link href="/about">Our story</Link></li>
                <li><Link href="/wishlist">Wishlist</Link></li>
                <li><Link href="/care-guide">Care guide</Link></li>
                <li><Link href="/faq">Help &amp; FAQs</Link></li>
                <li><Link href="/order-status">Track an order</Link></li>
                <li><Link href="/contact">Contact us</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white" aria-hidden>
      {n > 99 ? "99+" : n}
    </span>
  );
}
