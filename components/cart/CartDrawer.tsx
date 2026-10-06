"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";

import { Photo } from "@/components/Photo";
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
      <div className="animate-fade absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        className="animate-drawer absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white outline-none"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 id="cart-title" className="text-[15px]">
            Cart ({count})
          </h2>
          <button onClick={() => setOpen(false)} className="-mr-2 grid size-10 place-items-center" aria-label="Close cart">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p>Your cart is empty.</p>
            <Link href="/shop" className="btn btn-dark" onClick={() => setOpen(false)}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            {t.groups.length === 1 && (
              <div className="border-b border-line px-5 py-4">
                <FreeShippingBar remaining={t.toFreeShipping} />
              </div>
            )}
            <ul className="flex-1 overflow-y-auto px-5">
              {t.groups.map((g) => (
                <Fragment key={g.key}>
                  {/* Items from different makers ship separately, each with its own delivery */}
                  {t.groups.length > 1 && (
                    <li className="border-b border-line pt-5 pb-3">
                      <p className="text-[13px]">Shipped by {g.name}</p>
                      <div className="mt-2">
                        <FreeShippingBar remaining={g.toFreeShipping} />
                      </div>
                    </li>
                  )}
                  {g.lines.map((l) => {
                    const key = lineKey(l);
                    return (
                      <li key={key} className="flex gap-4 border-b border-line py-5 last:border-0">
                        <Link
                          href={`/products/${l.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative aspect-[4/5] w-20 shrink-0 bg-bone"
                        >
                          <Photo src={l.image} alt={l.name} sizes="80px" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col text-[14px]">
                          <div className="flex justify-between gap-3">
                            <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="hover:underline">
                              {l.name}
                            </Link>
                            <span className="tabular-nums">{formatMoney(lineTotalCents(l))}</span>
                          </div>
                          <p className="text-[13px] text-grey">{l.variantLabel}</p>
                          {l.monogram && <p className="text-[13px] text-grey">Monogram: {l.monogram}</p>}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QtyStepper small value={l.quantity} onChange={(n) => setQuantity(key, n)} label={`Quantity of ${l.name}`} />
                            <button onClick={() => remove(key)} className="link text-[13px] text-grey">
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </Fragment>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-5">
              <div className="flex justify-between text-[15px]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(t.subtotal)}</span>
              </div>
              <p className="mt-1 text-[12px] text-grey">
                Includes GST where it applies. Delivery and discount codes at checkout.
                {t.groups.length > 1 && ` Ships in ${t.groups.length} parcels.`}
              </p>
              <Link href="/checkout" className="btn btn-dark mt-4 w-full" onClick={() => setOpen(false)}>
                Checkout
              </Link>
              <Link href="/cart" className="link mt-3 block text-center text-[13px]" onClick={() => setOpen(false)}>
                View cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
