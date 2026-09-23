"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { TextileArt } from "@/components/TextileArt";
import { FreeShippingBar, QtyStepper } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { lineKey, lineTotalCents, totals } from "@/lib/pricing";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { lines, open, setOpen, setQuantity, remove, count } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const t = totals({ lines });

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="animate-fade-in absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="text-xl">
            Your cart {count > 0 && <span className="text-muted font-sans text-base">({count})</span>}
          </h2>
          <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-sand">
              <ShoppingBag className="text-gum" />
            </div>
            <p className="font-serif text-xl">Your cart is feeling a little empty</p>
            <p className="text-muted text-sm">Our Coogee Stripe towel is a good place to start.</p>
            <Link href="/shop" className="btn btn-primary mt-2" onClick={() => setOpen(false)}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingBar remaining={t.toFreeShipping} />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => {
                const key = lineKey(l);
                return (
                  <li key={key} className="flex gap-4 py-4">
                    <Link
                      href={`/products/${l.slug}`}
                      onClick={() => setOpen(false)}
                      className="size-20 shrink-0 overflow-hidden rounded-lg bg-sand"
                    >
                      <TextileArt
                        category={l.category}
                        collection={l.collection}
                        pattern={l.pattern}
                        colour={l.colourHex}
                        accent={l.accentHex}
                        imageUrl={l.imageUrl}
                        alt=""
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="font-semibold leading-snug hover:underline">
                            {l.name}
                          </Link>
                          <p className="text-muted text-sm">{l.variantLabel}</p>
                          {l.monogram && (
                            <p className="text-sm text-gum">
                              Monogram: <span className="font-semibold tracking-widest">{l.monogram}</span>
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{formatMoney(lineTotalCents(l))}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QtyStepper size="sm" value={l.quantity} onChange={(n) => setQuantity(key, n)} label={`Quantity of ${l.name}`} />
                        <button onClick={() => remove(key)} className="text-muted hover:text-clay p-1" aria-label={`Remove ${l.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line bg-white px-5 py-5">
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(t.subtotal)}</span>
              </div>
              <p className="text-muted mt-1 text-xs">Prices include GST. Shipping and discounts calculated at checkout.</p>
              <Link href="/checkout" className="btn btn-primary mt-4 w-full" onClick={() => setOpen(false)}>
                Checkout
              </Link>
              <Link href="/cart" className="mt-2 block text-center text-sm underline underline-offset-4" onClick={() => setOpen(false)}>
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
