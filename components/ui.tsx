import Link from "next/link";

import { formatMoney, formatPrice } from "@/lib/money";
import { store } from "@/lib/store";

export function Stars({ rating, size = 12, className = "" }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-px ${className}`} aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <svg key={i} viewBox="0 0 20 20" width={size} height={size} aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={fill} stopColor="currentColor" />
                <stop offset={fill} stopColor="#d6d3cd" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${Math.round(fill * 100)})`}
              d="M10 1.5l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L10 14.8l-5.4 2.9 1.2-5.9L1.4 7.7l6-.7z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function PriceTag({ cents, compareAt, from, className = "" }: { cents: number; compareAt?: number | null; from?: boolean; className?: string }) {
  const onSale = !!compareAt && compareAt > cents;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-sale" : ""}>
        {from && "From "}
        {formatPrice(cents)}
      </span>
      {onSale && (
        <s className="text-grey">
          <span className="sr-only">was </span>
          {formatPrice(compareAt)}
        </s>
      )}
    </span>
  );
}

export function FreeShippingBar({ remaining }: { remaining: number }) {
  const threshold = store.commerce.freeShippingThresholdCents;
  const pct = Math.min(100, ((threshold - remaining) / threshold) * 100);
  return (
    <div className="text-[13px]">
      <p>
        {remaining > 0 ? (
          <>
            Spend {formatMoney(remaining)} more for free delivery
          </>
        ) : (
          "Your order qualifies for free standard delivery"
        )}
      </p>
      <div
        className="mt-2 h-[3px] bg-stone"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to free delivery"
      >
        <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  max = 20,
  label,
  small,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label: string;
  small?: boolean;
}) {
  const h = small ? "h-9" : "h-12";
  return (
    <div className={`inline-flex items-center border border-line ${h}`} role="group" aria-label={label}>
      <button type="button" className="grid h-full w-9 place-items-center text-lg hover:bg-bone" onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        −
      </button>
      <span className="min-w-7 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid h-full w-9 place-items-center text-lg hover:bg-bone disabled:opacity-30"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-grey">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink">
                {it.label}
              </Link>
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

export function PageTitle({ title, intro, crumbs }: { title: string; intro?: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <header className="page-x pt-8 pb-8 md:pt-12 md:pb-10">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <h1 className="wide mt-4 text-3xl md:text-5xl">{title}</h1>
      {intro && <p className="mt-4 max-w-xl text-grey">{intro}</p>}
    </header>
  );
}
