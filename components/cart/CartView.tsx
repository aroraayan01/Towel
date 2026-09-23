"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";
import { TextileArt } from "@/components/TextileArt";
import { FreeShippingBar, QtyStepper } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { lineKey, lineTotalCents, lineUnitCents, totals } from "@/lib/pricing";

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const t = totals({ lines });

  if (!ready) return <div className="container-page min-h-[50vh] py-16" aria-busy />;

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-4xl">Your cart</h1>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-sand px-6 py-20 text-center">
          <p className="font-serif text-2xl">Nothing in here yet</p>
          <p className="text-muted mt-2">Our bestsellers are a good place to start.</p>
          <Link href="/shop" className="btn btn-primary mt-8">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((l) => {
              const key = lineKey(l);
              return (
                <li key={key} className="flex gap-4 py-5 sm:gap-6">
                  <Link href={`/products/${l.slug}`} className="size-24 shrink-0 overflow-hidden rounded-xl bg-sand sm:size-32">
                    <TextileArt category={l.category} collection={l.collection} pattern={l.pattern} colour={l.colourHex} accent={l.accentHex} imageUrl={l.imageUrl} alt={l.name} />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link href={`/products/${l.slug}`} className="text-lg font-semibold hover:underline">
                          {l.name}
                        </Link>
                        <p className="text-muted">{l.variantLabel}</p>
                        {l.monogram && <p className="text-gum text-sm">Monogram: {l.monogram} (+{formatMoney(lineUnitCents(l) - l.unitCents)})</p>}
                        <p className="text-muted text-sm">{formatMoney(lineUnitCents(l))} each</p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatMoney(lineTotalCents(l))}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-4 pt-3">
                      <QtyStepper value={l.quantity} onChange={(n) => setQuantity(key, n)} label={`Quantity of ${l.name}`} />
                      <button onClick={() => remove(key)} className="text-muted flex items-center gap-1 text-sm hover:text-clay">
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
            <FreeShippingBar remaining={t.toFreeShipping} />
            <div className="mt-5 flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(t.subtotal)}</span>
            </div>
            <p className="text-muted mt-1 text-sm">Includes GST. Shipping, gift notes and discount codes at checkout.</p>
            <Link href="/checkout" className="btn btn-primary mt-5 w-full py-4">
              Checkout
            </Link>
            <Link href="/shop" className="mt-4 flex items-center justify-center gap-1 text-sm underline underline-offset-4">
              <ArrowLeft size={14} /> Keep shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
