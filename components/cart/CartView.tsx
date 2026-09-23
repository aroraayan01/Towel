"use client";

import Link from "next/link";

import { Photo } from "@/components/Photo";
import { FreeShippingBar, QtyStepper } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { lineKey, lineTotalCents, lineUnitCents, totals } from "@/lib/pricing";
import { useCart } from "./CartProvider";

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const t = totals({ lines });

  if (!ready) return <div className="page-x min-h-[50vh] py-16" aria-busy />;

  return (
    <div className="page-x py-10 md:py-14">
      <h1 className="wide text-3xl md:text-4xl">Cart</h1>
      {lines.length === 0 ? (
        <div className="mt-10 border-t border-line py-20 text-center">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="btn btn-dark mt-6">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <ul className="border-t border-line">
            {lines.map((l) => {
              const key = lineKey(l);
              return (
                <li key={key} className="flex gap-5 border-b border-line py-6">
                  <Link href={`/products/${l.slug}`} className="relative aspect-[4/5] w-24 shrink-0 bg-bone md:w-32">
                    <Photo src={l.image} alt={l.name} sizes="128px" />
                  </Link>
                  <div className="flex flex-1 flex-col text-[14px]">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link href={`/products/${l.slug}`} className="text-[15px] hover:underline">
                          {l.name}
                        </Link>
                        <p className="text-grey">{l.variantLabel}</p>
                        {l.monogram && <p className="text-grey">Monogram: {l.monogram}</p>}
                        <p className="mt-1 text-grey">{formatMoney(lineUnitCents(l))} each</p>
                      </div>
                      <p className="tabular-nums">{formatMoney(lineTotalCents(l))}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-5 pt-4">
                      <QtyStepper small value={l.quantity} onChange={(n) => setQuantity(key, n)} label={`Quantity of ${l.name}`} />
                      <button onClick={() => remove(key)} className="link text-[13px] text-grey">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="h-fit bg-bone p-6">
            <FreeShippingBar remaining={t.toFreeShipping} />
            <div className="mt-6 flex justify-between text-[15px]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(t.subtotal)}</span>
            </div>
            <p className="mt-1 text-[12px] text-grey">Includes GST. Delivery, gift notes and discount codes at checkout.</p>
            <Link href="/checkout" className="btn btn-dark mt-5 w-full">
              Checkout
            </Link>
            <Link href="/shop" className="link mt-4 block text-center text-[13px]">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
