import { Minus, Plus, Star, Truck } from "lucide-react";

import { formatMoney, formatPrice } from "@/lib/money";
import { store } from "@/lib/store";

export function Stars({ rating, size = 14, className = "" }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <Star size={size} className="absolute inset-0 text-sand-dark" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-wattle" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function PriceTag({
  cents,
  compareAt,
  from,
  className = "",
}: {
  cents: number;
  compareAt?: number | null;
  from?: boolean;
  className?: string;
}) {
  const onSale = compareAt && compareAt > cents;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-clay" : ""}>
        {from && <span className="text-muted text-[0.85em] font-normal">From </span>}
        {formatPrice(cents)}
      </span>
      {onSale && (
        <s className="text-muted text-[0.85em] font-normal">
          <span className="sr-only">was </span>
          {formatPrice(compareAt!)}
        </s>
      )}
    </span>
  );
}

export function FreeShippingBar({ remaining }: { remaining: number }) {
  const threshold = store.commerce.freeShippingThresholdCents;
  const pct = Math.min(100, ((threshold - remaining) / threshold) * 100);
  return (
    <div className="rounded-xl bg-sand px-4 py-3 text-sm">
      <p className="flex items-center gap-2">
        <Truck size={16} className="text-gum shrink-0" aria-hidden />
        {remaining > 0 ? (
          <span>
            You&apos;re <strong>{formatMoney(remaining)}</strong> away from free standard shipping
          </span>
        ) : (
          <span>
            <strong>Woohoo — free standard shipping</strong> is on us
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-dark" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
        <div className="h-full rounded-full bg-gum transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  max = 20,
  label,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-10";
  return (
    <div className={`inline-flex items-center rounded-full border border-line bg-white ${h}`} role="group" aria-label={label}>
      <button type="button" className={`${w} grid h-full place-items-center rounded-full hover:bg-sand`} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={`${w} grid h-full place-items-center rounded-full hover:bg-sand disabled:opacity-40`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <a href={it.href} className="hover:text-ink hover:underline underline-offset-4">
                {it.label}
              </a>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="border-b border-line bg-sand/60">
      <div className="container-page py-12 sm:py-16">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="text-muted mt-4 max-w-2xl text-lg">{intro}</p>}
      </div>
    </header>
  );
}
