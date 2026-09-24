"use client";

import { useMemo, useRef, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Photo } from "@/components/Photo";
import { PriceTag, QtyStepper, Stars } from "@/components/ui";
import { afterpayInstalment, formatMoney, formatPrice } from "@/lib/money";
import { cleanMonogram, MONOGRAM_MAX } from "@/lib/pricing";
import { PLACEHOLDER } from "@/lib/placeholder";
import { store } from "@/lib/store";
import { WishlistButton } from "./WishlistButton";

export type BuyBoxProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  monogramable: boolean;
  rating: number | null;
  reviewCount: number;
  images: { url: string; alt: string; colourName: string | null }[];
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

export function ProductBuyBox({
  product,
  initialColour,
  children,
}: {
  product: BuyBoxProduct;
  initialColour?: string;
  children?: React.ReactNode;
}) {
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
    const inStock = product.variants.filter((v) => v.colourName === startColour && v.stock > 0);
    // Default to the size most people buy: a bath towel, or a Queen for bedding
    return (inStock.find((v) => /bath towel|^queen/i.test(v.size)) ?? inStock[0] ?? product.variants[0]).size;
  });
  const [qty, setQty] = useState(1);
  const [wantsMonogram, setWantsMonogram] = useState(false);
  const [monogram, setMonogram] = useState("");
  const [added, setAdded] = useState(false);
  const [slide, setSlide] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  const variant =
    product.variants.find((v) => v.colourName === colour && v.size === size) ??
    product.variants.find((v) => v.colourName === colour)!;
  const soldOut = variant.stock <= 0;
  const mono = wantsMonogram ? cleanMonogram(monogram) : undefined;
  const unit = variant.priceCents + (mono ? store.commerce.monogramCents : 0);
  const isLeather = product.category === "leather";

  const gallery = useMemo(() => {
    const own = product.images.filter((i) => i.colourName === colour);
    const shared = product.images.filter((i) => !i.colourName);
    const list = [...own, ...shared];
    return list.length ? list : [{ url: PLACEHOLDER, alt: product.name, colourName: null }];
  }, [product.images, product.name, colour]);

  function pickColour(name: string) {
    setColour(name);
    setSlide(0);
    strip.current?.scrollTo({ left: 0 });
    if (!product.variants.some((v) => v.colourName === name && v.size === size)) {
      setSize(product.variants.find((v) => v.colourName === name)!.size);
    }
  }

  function addToCart() {
    if (soldOut || (wantsMonogram && !mono)) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      // Only mention the options that actually vary for this product
      variantLabel:
        [colours.length > 1 && variant.colourName, sizes.length > 1 && variant.size].filter(Boolean).join(" / ") || variant.size,
      image: gallery[0].url,
      unitCents: variant.priceCents,
      quantity: Math.min(qty, variant.stock),
      monogram: mono,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12 xl:gap-20">
      {/* Gallery: swipe strip on mobile, stacked grid on desktop */}
      <div className="-mx-5 md:mx-0">
        <div
          ref={strip}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible"
          onScroll={(e) => {
            const el = e.currentTarget;
            setSlide(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label={`${product.name} photos`}
        >
          {gallery.map((img, i) => (
            <div
              key={`${colour}-${img.url}`}
              className={`relative aspect-[4/5] w-full shrink-0 snap-center bg-bone ${i === 0 && gallery.length % 2 === 1 ? "lg:col-span-2 lg:aspect-[5/4]" : ""}`}
            >
              <Photo src={img.url} alt={img.alt} sizes="(min-width: 1024px) 60vw, 100vw" preload={i === 0} className="animate-fade" />
            </div>
          ))}
        </div>
        {gallery.length > 1 && (
          <p className="mt-3 text-center text-[13px] text-grey lg:hidden" aria-live="polite">
            {slide + 1} / {gallery.length}
          </p>
        )}
      </div>

      {/* Buy panel */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[32px] leading-[1.05] md:text-[42px]">{product.name}</h1>
          <WishlistButton slug={product.slug} name={product.name} className="-mr-2 shrink-0" />
        </div>
        <p className="mt-2 text-lg">
          <PriceTag cents={variant.priceCents} compareAt={variant.compareAtCents} />
        </p>
        {store.commerce.afterpay.enabled && unit >= store.commerce.afterpay.minCents && unit <= store.commerce.afterpay.maxCents && (
          <p className="mt-1 text-[13px] text-grey">or 4 payments of {formatMoney(afterpayInstalment(unit))} with Afterpay</p>
        )}
        {product.rating !== null && (
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13px] text-grey hover:text-ink">
            <Stars rating={product.rating} />
            {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
          </a>
        )}
        <p className="mt-5 text-[15px] text-[#3b3a38]">{product.tagline}</p>

        {/* Colour */}
        <fieldset className="mt-7">
          <legend className="mb-3 text-[14px]">
            Colour: <span className="text-grey">{colour}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colours.map((c) => (
              <label key={c.name} className="cursor-pointer" title={c.name}>
                <input type="radio" name="colour" value={c.name} checked={colour === c.name} onChange={() => pickColour(c.name)} className="peer sr-only" />
                <span
                  className={`relative block size-8 rounded-full ring-1 ring-black/10 ring-offset-2 transition peer-checked:ring-ink peer-focus-visible:ring-ink ${!c.inStock ? "opacity-40" : ""}`}
                  style={{ background: c.accent !== c.hex ? `linear-gradient(135deg, ${c.hex} 55%, ${c.accent} 55%)` : c.hex }}
                />
                <span className="sr-only">
                  {c.name}
                  {!c.inStock && " (sold out)"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Size */}
        <fieldset className="mt-6">
          <legend className="mb-3 text-[14px]">Size</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const v = product.variants.find((x) => x.colourName === colour && x.size === s);
              if (!v) return null;
              const out = v.stock <= 0;
              return (
                <label key={s} className="cursor-pointer">
                  <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="peer sr-only" />
                  <span
                    className={`block border px-4 py-2.5 text-[14px] transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-1 ${out ? "border-line text-grey line-through" : "border-line hover:border-ink"}`}
                  >
                    {s}
                    {sizes.length > 1 && !out && <span className="ml-2 opacity-60">{formatPrice(v.priceCents)}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Monogram */}
        {product.monogramable && (
          <div className="mt-6 border-t border-line pt-5">
            <label className="flex cursor-pointer items-center gap-3 text-[14px]">
              <input type="checkbox" checked={wantsMonogram} onChange={(e) => setWantsMonogram(e.target.checked)} className="size-4 accent-ink" />
              {isLeather ? "Add your initials" : "Add a monogram"} (+{formatPrice(store.commerce.monogramCents)})
            </label>
            {wantsMonogram && (
              <div className="mt-3 pl-7">
                <label htmlFor="monogram" className="field-label">
                  Up to {MONOGRAM_MAX} letters, {isLeather ? "heat-debossed into the leather" : "embroidered in white thread"}
                </label>
                <input
                  id="monogram"
                  value={monogram}
                  onChange={(e) => setMonogram(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, "").slice(0, MONOGRAM_MAX))}
                  maxLength={MONOGRAM_MAX}
                  placeholder="ABC"
                  className="input w-32 text-center text-lg tracking-[0.35em] uppercase"
                />
                <p className="mt-2 text-[12px] text-grey">Ships 2 to 3 business days later. Personalised items can&apos;t be returned for change of mind.</p>
              </div>
            )}
          </div>
        )}

        {/* Add to cart */}
        <div className="mt-6 flex gap-2">
          <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={Math.max(1, Math.min(20, variant.stock))} label="Quantity" />
          <button className="btn btn-dark flex-1" onClick={addToCart} disabled={soldOut || (wantsMonogram && !mono)}>
            {added ? "Added" : soldOut ? "Sold out" : `Add to cart · ${formatMoney(unit * qty)}`}
          </button>
        </div>
        <p className={`mt-3 text-[13px] ${soldOut ? "text-sale" : variant.stock <= 3 ? "text-sale" : "text-grey"}`}>
          {soldOut ? (
            <>
              Sold out in this size.{" "}
              <a className="link" href={`/contact?product=${encodeURIComponent(`${product.name}, ${colour}, ${size}`)}`}>
                Ask us when it&apos;s back
              </a>
            </>
          ) : variant.stock <= 3 ? (
            `Only ${variant.stock} left. Ships in 1 to 2 business days.`
          ) : (
            "In stock. Ships in 1 to 2 business days."
          )}
        </p>

        {children}
      </div>
    </div>
  );
}
