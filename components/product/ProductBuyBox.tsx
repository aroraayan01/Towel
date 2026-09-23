"use client";

import { Check, MapPin, PenLine, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { TextileArt, viewsFor, type ArtView } from "@/components/TextileArt";
import { PriceTag, QtyStepper, Stars } from "@/components/ui";
import { afterpayInstalment, formatMoney, formatPrice } from "@/lib/money";
import { cleanMonogram, MONOGRAM_MAX } from "@/lib/pricing";
import { allQuotes, stateForPostcode } from "@/lib/shipping";
import { store } from "@/lib/store";
import { WishlistButton } from "./WishlistButton";

export type BuyBoxProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  collection: string;
  pattern: string;
  imageUrl: string | null;
  monogramable: boolean;
  isNew: boolean;
  bestseller: boolean;
  rating: number | null;
  reviewCount: number;
  variants: {
    id: string;
    colourName: string;
    colourHex: string;
    accentHex: string;
    size: string;
    priceCents: number;
    compareAtCents: number | null;
    stock: number;
  }[];
};

const VIEW_LABEL: Record<ArtView, string> = { main: "Full view", alt: "Styled", detail: "Close-up of the weave" };

export function ProductBuyBox({ product, initialColour }: { product: BuyBoxProduct; initialColour?: string }) {
  const { add } = useCart();
  const colours = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string; accent: string; inStock: boolean }>();
    for (const v of product.variants) {
      const c = seen.get(v.colourName);
      if (c) c.inStock ||= v.stock > 0;
      else seen.set(v.colourName, { name: v.colourName, hex: v.colourHex, accent: v.accentHex, inStock: v.stock > 0 });
    }
    return [...seen.values()];
  }, [product.variants]);
  const sizes = useMemo(() => [...new Set(product.variants.map((v) => v.size))], [product.variants]);

  const startColour =
    colours.find((c) => c.name.toLowerCase() === initialColour?.toLowerCase())?.name ??
    colours.find((c) => c.inStock)?.name ??
    colours[0].name;
  const [colour, setColour] = useState(startColour);
  const [size, setSize] = useState(() => {
    // Default to the most "standard" size that's in stock (bath towel over hand towel)
    const inStock = product.variants.filter((v) => v.colourName === startColour && v.stock > 0);
    return (inStock.find((v) => /bath towel/i.test(v.size)) ?? inStock[0] ?? product.variants[0]).size;
  });
  const [view, setView] = useState<ArtView>("main");
  const [qty, setQty] = useState(1);
  const [wantsMonogram, setWantsMonogram] = useState(false);
  const [monogram, setMonogram] = useState("");
  const [added, setAdded] = useState(false);
  const [postcode, setPostcode] = useState("");

  const variant =
    product.variants.find((v) => v.colourName === colour && v.size === size) ??
    product.variants.find((v) => v.colourName === colour)!;
  const col = colours.find((c) => c.name === colour)!;
  const soldOut = variant.stock <= 0;
  const mono = wantsMonogram ? cleanMonogram(monogram) : undefined;
  const unit = variant.priceCents + (mono ? store.commerce.monogramCents : 0);
  const views = product.imageUrl ? (["main"] as ArtView[]) : viewsFor(product.collection);
  const pcState = stateForPostcode(postcode);

  function addToCart() {
    if (soldOut) return;
    if (wantsMonogram && !mono) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantLabel: `${variant.colourName} · ${variant.size}`,
      category: product.category,
      collection: product.collection,
      pattern: product.pattern,
      colourHex: variant.colourHex,
      accentHex: variant.accentHex,
      imageUrl: product.imageUrl,
      unitCents: variant.priceCents,
      quantity: Math.min(qty, variant.stock),
      monogram: mono,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      {/* ── Gallery ─────────────────────────────── */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
          <TextileArt
            key={`${colour}-${view}`}
            category={product.category}
            collection={product.collection}
            pattern={product.pattern}
            colour={col.hex}
            accent={col.accent}
            view={view}
            imageUrl={product.imageUrl}
            alt={`${product.name} in ${colour} — ${VIEW_LABEL[view].toLowerCase()}`}
            className="animate-fade-in"
          />
          {mono && product.category === "towels" && view === "main" && (
            <span className="pointer-events-none absolute left-1/2 top-[54%] -translate-x-1/2 font-serif text-3xl tracking-[0.3em] drop-shadow-sm sm:text-4xl" style={{ color: col.accent }} aria-hidden>
              {mono}
            </span>
          )}
          <WishlistButton slug={product.slug} name={product.name} className="absolute right-4 top-4" />
        </div>
        {views.length > 1 && (
          <div className="mt-3 grid grid-cols-3 gap-3" role="tablist" aria-label="Product images">
            {views.map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                aria-label={VIEW_LABEL[v]}
                onClick={() => setView(v)}
                className={`aspect-square overflow-hidden rounded-xl border-2 bg-sand transition ${view === v ? "border-ink" : "border-transparent opacity-80 hover:opacity-100"}`}
              >
                <TextileArt category={product.category} collection={product.collection} pattern={product.pattern} colour={col.hex} accent={col.accent} view={v} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Details ─────────────────────────────── */}
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {product.bestseller && <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold">Bestseller</span>}
          {product.isNew && <span className="rounded-full bg-wattle px-3 py-1 text-xs font-bold">New</span>}
        </div>
        <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
        {product.rating !== null && (
          <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm hover:underline">
            <Stars rating={product.rating} />
            <span>
              {product.rating.toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
            </span>
          </a>
        )}
        <p className="mt-4 text-2xl font-semibold">
          <PriceTag cents={variant.priceCents} compareAt={variant.compareAtCents} />
        </p>
        <p className="text-muted text-xs">Includes GST</p>
        {store.commerce.afterpay.enabled && unit >= store.commerce.afterpay.minCents && unit <= store.commerce.afterpay.maxCents && (
          <p className="text-muted mt-2 text-sm">
            or 4 interest-free payments of <strong className="text-ink">{formatMoney(afterpayInstalment(unit))}</strong> with{" "}
            <span className="rounded bg-[#b2fce4] px-1.5 py-0.5 text-xs font-bold text-black">Afterpay</span>
          </p>
        )}
        <p className="mt-5 text-lg text-[#463f39]">{product.tagline}</p>

        {/* Colour */}
        <fieldset className="mt-7">
          <legend className="mb-3 text-sm">
            <span className="font-semibold">Colour:</span> {colour}
          </legend>
          <div className="flex flex-wrap gap-3">
            {colours.map((c) => (
              <label key={c.name} className="cursor-pointer" title={c.name}>
                <input
                  type="radio"
                  name="colour"
                  value={c.name}
                  checked={colour === c.name}
                  onChange={() => {
                    setColour(c.name);
                    // Keep the size if it exists in the new colour
                    if (!product.variants.some((v) => v.colourName === c.name && v.size === size)) {
                      setSize(product.variants.find((v) => v.colourName === c.name)!.size);
                    }
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`relative block size-11 rounded-full border-2 border-white shadow ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-gum ${!c.inStock ? "opacity-50" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${c.hex} 60%, ${c.accent} 60%)` }}
                >
                  {!c.inStock && <span className="absolute inset-0 m-auto h-0.5 w-full rotate-45 bg-ink/60" />}
                </span>
                <span className="sr-only">
                  {c.name}
                  {!c.inStock && " (sold out)"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Size */}
        {sizes.length > 1 ? (
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold">Size</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {sizes.map((s) => {
                const v = product.variants.find((x) => x.colourName === colour && x.size === s);
                if (!v) return null;
                const out = v.stock <= 0;
                return (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="peer sr-only" />
                    <span className="flex items-center justify-between gap-2 rounded-xl border-2 border-line bg-white px-4 py-3 text-sm transition peer-checked:border-ink peer-focus-visible:border-gum hover:border-muted">
                      <span className={out ? "text-muted line-through" : ""}>{s}</span>
                      <span className="font-semibold">{out ? "Sold out" : formatPrice(v.priceCents)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="mt-6 text-sm">
            <span className="font-semibold">Size:</span> {sizes[0]}
          </p>
        )}

        {/* Monogram */}
        {product.monogramable && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={wantsMonogram} onChange={(e) => setWantsMonogram(e.target.checked)} className="mt-1 size-4 accent-[var(--color-gum)]" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <PenLine size={15} /> Add a monogram (+{formatPrice(store.commerce.monogramCents)})
                </span>
                <span className="text-muted block text-sm">Up to {MONOGRAM_MAX} letters, embroidered in our studio. Adds 2–3 business days.</span>
              </span>
            </label>
            {wantsMonogram && (
              <div className="mt-3 pl-7">
                <label htmlFor="monogram" className="label">
                  Your letters
                </label>
                <input
                  id="monogram"
                  value={monogram}
                  onChange={(e) => setMonogram(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, "").slice(0, MONOGRAM_MAX))}
                  maxLength={MONOGRAM_MAX}
                  placeholder="e.g. MJS"
                  className="field max-w-40 text-center font-serif text-xl tracking-[0.3em] uppercase"
                  aria-describedby="monogram-help"
                />
                <p id="monogram-help" className="text-muted mt-1 text-xs">
                  Letters A–Z only. Personalised items can&apos;t be returned for change of mind.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stock + add */}
        <p className={`mt-6 flex items-center gap-2 text-sm font-medium ${soldOut ? "text-clay" : variant.stock <= 3 ? "text-[#a66a00]" : "text-gum"}`}>
          <span className={`size-2 rounded-full ${soldOut ? "bg-clay" : variant.stock <= 3 ? "bg-wattle" : "bg-gum"}`} aria-hidden />
          {soldOut
            ? "Sold out in this colour and size — more on the way"
            : variant.stock <= 3
              ? `Only ${variant.stock} left — ships within 1–2 business days`
              : "In stock — ships within 1–2 business days"}
        </p>
        <div className="mt-4 flex gap-3">
          <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={Math.max(1, Math.min(20, variant.stock))} label="Quantity" />
          <button className="btn btn-primary flex-1" onClick={addToCart} disabled={soldOut || (wantsMonogram && !mono)}>
            {added ? (
              <>
                <Check size={18} /> Added to cart
              </>
            ) : soldOut ? (
              "Sold out"
            ) : (
              `Add to cart · ${formatMoney(unit * qty)}`
            )}
          </button>
        </div>
        {soldOut && (
          <p className="text-muted mt-2 text-sm">
            Want to know when it&apos;s back? <a href={`/contact?product=${encodeURIComponent(`${product.name} – ${colour}, ${size}`)}`} className="underline">Let us know</a> and we&apos;ll email you.
          </p>
        )}

        {/* Delivery estimate */}
        <div className="mt-6 rounded-2xl bg-sand p-4 text-sm">
          <label htmlFor="pc" className="flex items-center gap-2 font-semibold">
            <MapPin size={16} /> Check delivery to your postcode
          </label>
          <input
            id="pc"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 3000"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="field mt-2 max-w-32 py-2"
            autoComplete="postal-code"
          />
          {postcode.length === 4 &&
            (pcState ? (
              <ul className="mt-3 space-y-1" aria-live="polite">
                {allQuotes(pcState, unit * qty).map((q) => (
                  <li key={q.method} className="flex justify-between gap-4">
                    <span>
                      {q.label} to {pcState} <span className="text-muted">· {q.eta}</span>
                    </span>
                    <span className="font-semibold">{q.free ? "Free" : formatMoney(q.cents)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-clay">That doesn&apos;t look like an Australian postcode.</p>
            ))}
        </div>

        <ul className="text-muted mt-6 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Truck size={16} className="text-gum" /> Free standard shipping on orders over {formatPrice(store.commerce.freeShippingThresholdCents)}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gum" /> {store.commerce.returnDays}-day change-of-mind returns
          </li>
        </ul>
      </div>
    </div>
  );
}
