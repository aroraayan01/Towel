"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Photo } from "@/components/Photo";
import { FreeShippingBar } from "@/components/ui";
import { afterpayInstalment, formatMoney } from "@/lib/money";
import { lineKey, lineTotalCents, totals } from "@/lib/pricing";
import { allQuotes, STATES, stateForPostcode, type ShippingMethod, type StateCode } from "@/lib/shipping";
import { store } from "@/lib/store";
import { placeOrder, previewDiscount, type CheckoutState } from "./actions";

export function CheckoutForm({ paymentsLive, cancelled }: { paymentsLive: boolean; cancelled: boolean }) {
  const { lines, ready } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<StateCode | "">("");
  const [postcode, setPostcode] = useState("");
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [giftWrap, setGiftWrap] = useState(false);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; percentOff: number } | null>(null);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();

  const t = totals({ lines, state: region || null, method, percentOff: applied?.percentOff, giftWrap });
  const quotes = allQuotes(region || null, t.subtotal - t.discount);
  const pcState = stateForPostcode(postcode);
  const pcMismatch = postcode.length === 4 && region && pcState !== region;
  const err = state?.fields ?? {};

  const cartJson = useMemo(
    () => JSON.stringify(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, monogram: l.monogram }))),
    [lines]
  );

  function applyCode() {
    if (!code.trim()) return;
    startCheck(async () => {
      const r = await previewDiscount(code, email, t.subtotal);
      if (r.ok) {
        setApplied({ code: r.code, percentOff: r.percentOff });
        setCodeMsg(`${r.percentOff}% off applied`);
      } else {
        setApplied(null);
        setCodeMsg(r.message);
      }
    });
  }

  if (!ready) return <div className="page-x min-h-[50vh] py-16" aria-busy />;

  if (lines.length === 0) {
    return (
      <div className="page-x py-24 text-center">
        <h1 className="wide text-3xl">Your cart is empty</h1>
        <Link href="/shop" className="btn btn-dark mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="page-x grid gap-10 py-8 lg:grid-cols-[1fr_420px] lg:gap-20 lg:py-12">
      <input type="hidden" name="cart" value={cartJson} />
      <input type="hidden" name="discountCode" value={applied?.code ?? ""} />

      <div className="space-y-10">
        <div>
          <h1 className="wide text-3xl md:text-4xl">Checkout</h1>
          <p className="mt-2 text-[13px] text-grey">Payments are processed by Stripe. We never see your card details.</p>
          {cancelled && (
            <p className="mt-4 bg-bone px-4 py-3 text-[14px]" role="status">
              Payment was cancelled and you haven&apos;t been charged.
            </p>
          )}
          {!paymentsLive && (
            <p className="mt-4 border border-sale/40 px-4 py-3 text-[13px] text-sale" role="note">
              Test mode: no payment provider is connected, so orders go through without payment. Set STRIPE_SECRET_KEY to go
              live.
            </p>
          )}
        </div>

        <Section title="Contact">
          <Input name="email" label="Email" type="email" autoComplete="email" required error={err.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-3 flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="marketingOptIn" className="size-4 accent-ink" />
            Email me about new products and restocks
          </label>
        </Section>

        <Section title="Delivery">
          <p className="-mt-2 mb-4 text-[13px] text-grey">We deliver within Australia only.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="firstName" label="First name" autoComplete="given-name" required error={err.firstName} />
            <Input name="lastName" label="Last name" autoComplete="family-name" required error={err.lastName} />
            <div className="sm:col-span-2">
              <Input name="address1" label="Street address" autoComplete="address-line1" required error={err.address1} />
            </div>
            <div className="sm:col-span-2">
              <Input name="address2" label="Apartment, unit, etc. (optional)" autoComplete="address-line2" />
            </div>
            <Input name="suburb" label="Suburb" autoComplete="address-level2" required error={err.suburb} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="field-label">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  autoComplete="address-level1"
                  className="input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as StateCode)}
                  aria-invalid={!!err.state}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                name="postcode"
                label="Postcode"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                maxLength={4}
                pattern="\d{4}"
                value={postcode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPostcode(v);
                  const guess = stateForPostcode(v);
                  if (guess && !region) setRegion(guess);
                }}
                error={err.postcode ?? (pcMismatch ? `Not a ${region} postcode` : undefined)}
              />
            </div>
            <div className="sm:col-span-2">
              <Input name="phone" label="Phone (optional, for the courier)" type="tel" autoComplete="tel" error={err.phone} />
            </div>
          </div>
        </Section>

        <Section title="Delivery method">
          <div className="space-y-2">
            {quotes.map((q) => (
              <label
                key={q.method}
                className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-3.5 text-[14px] transition ${method === q.method ? "border-ink" : "border-line hover:border-grey"}`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="method" value={q.method} checked={method === q.method} onChange={() => setMethod(q.method)} className="size-4 accent-ink" />
                  <span>
                    <span className="block">{q.label}</span>
                    <span className="text-[13px] text-grey">
                      {q.eta}
                      {!region && ". Select your state for the exact price."}
                    </span>
                  </span>
                </span>
                <span>{q.free ? "Free" : formatMoney(q.cents)}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Gift options">
          <label htmlFor="giftMessage" className="field-label">
            Gift note (free, written by hand on a card)
          </label>
          <textarea
            id="giftMessage"
            name="giftMessage"
            rows={3}
            maxLength={250}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your message"
            className="input"
          />
          <p className="mt-1 flex justify-between text-[12px] text-grey">
            <span>We never include prices in the parcel.</span>
            <span>{note.length}/250</span>
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-[14px]">
            <input type="checkbox" name="giftWrap" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="mt-1 size-4 accent-ink" />
            <span>
              Gift wrap (+{formatMoney(store.commerce.giftWrapCents)})
              <span className="block text-[13px] text-grey">Recycled tissue and cotton twine.</span>
            </span>
          </label>
        </Section>

        {state?.error && (
          <p className="border border-sale px-4 py-3 text-[14px] text-sale" role="alert">
            {state.error}
          </p>
        )}

        <div className="lg:hidden">
          <PayButton pending={pending} total={t.total} paymentsLive={paymentsLive} disabled={!!pcMismatch} />
        </div>
      </div>

      {/* ── Summary ───────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
        <div className="bg-bone p-6">
          <h2 className="mb-2 text-[15px]">Order summary</h2>
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <li key={lineKey(l)} className="flex gap-3 py-3">
                <div className="relative aspect-[4/5] w-14 shrink-0 bg-stone">
                  <Photo src={l.image} alt="" sizes="56px" />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p>{l.name}</p>
                  <p className="text-[13px] text-grey">{l.variantLabel}</p>
                  {l.monogram && <p className="text-[13px] text-grey">Monogram: {l.monogram}</p>}
                </div>
                <p className="text-[14px] tabular-nums">{formatMoney(lineTotalCents(l))}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <label htmlFor="code" className="sr-only">
              Discount code
            </label>
            <div className="relative flex-1">
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCode();
                  }
                }}
                placeholder="Discount code"
                className="input"
                aria-invalid={!!err.discountCode}
              />
            </div>
            <button type="button" onClick={applyCode} disabled={checking || !code} className="btn btn-line px-5">
              {checking ? "…" : "Apply"}
            </button>
          </div>
          {codeMsg && (
            <p className={`mt-2 text-[13px] ${applied ? "text-ok" : "text-sale"}`} role="status">
              {codeMsg}
              {applied && (
                <button
                  type="button"
                  className="ml-2 text-grey underline"
                  onClick={() => {
                    setApplied(null);
                    setCodeMsg(null);
                    setCode("");
                  }}
                >
                  Remove
                </button>
              )}
            </p>
          )}

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[14px]">
            <Row label="Subtotal" value={formatMoney(t.subtotal)} />
            {t.discount > 0 && <Row label={`Discount (${applied?.code})`} value={`−${formatMoney(t.discount)}`} highlight />}
            {t.giftWrap > 0 && <Row label="Gift wrapping" value={formatMoney(t.giftWrap)} />}
            <Row label={t.shipping.label} value={t.shipping.free ? "Free" : region ? formatMoney(t.shipping.cents) : `from ${formatMoney(t.shipping.cents)}`} />
            <div className="flex justify-between border-t border-line pt-3 text-[17px]">
              <dt>Total</dt>
              <dd className="tabular-nums">
                <span className="mr-1 text-[12px] text-grey">AUD</span>
                {formatMoney(t.total)}
              </dd>
            </div>
            <Row label="Includes GST of" value={formatMoney(t.gst)} muted />
          </dl>

          {t.toFreeShipping > 0 && (
            <div className="mt-4">
              <FreeShippingBar remaining={t.toFreeShipping} />
            </div>
          )}

          <div className="mt-5 hidden lg:block">
            <PayButton pending={pending} total={t.total} paymentsLive={paymentsLive} disabled={!!pcMismatch} />
          </div>
          {store.commerce.afterpay.enabled && t.total <= store.commerce.afterpay.maxCents && (
            <p className="mt-3 text-center text-[12px] text-grey">
              Afterpay available on the next step: 4 payments of {formatMoney(afterpayInstalment(t.total))}
            </p>
          )}
        </div>
        <p className="mt-4 px-2 text-center text-[12px] text-grey">
          By placing an order you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>. {store.commerce.returnDays}-day returns ·{" "}
          <Link href="/returns" className="underline">details</Link>
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-[17px]">{title}</h2>
      {children}
    </section>
  );
}

function Input({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input id={name} name={name} className="input" aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} {...rest} />
      {error && (
        <p id={`${name}-err`} className="mt-1 text-[13px] text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-[12px] text-grey" : ""}`}>
      <dt>{label}</dt>
      <dd className={`tabular-nums ${highlight ? "text-ok" : ""}`}>{value}</dd>
    </div>
  );
}

function PayButton({ pending, total, paymentsLive, disabled }: { pending: boolean; total: number; paymentsLive: boolean; disabled: boolean }) {
  return (
    <button className="btn btn-dark h-14 w-full" disabled={pending || disabled}>
      {pending ? "Please wait…" : paymentsLive ? `Continue to payment · ${formatMoney(total)}` : `Place test order · ${formatMoney(total)}`}
    </button>
  );
}
