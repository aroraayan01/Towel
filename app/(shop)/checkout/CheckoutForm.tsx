"use client";

import Link from "next/link";
import { Gift, Lock, Tag } from "lucide-react";
import { useActionState, useMemo, useState, useTransition } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { TextileArt } from "@/components/TextileArt";
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

  if (!ready) return <div className="container-page min-h-[50vh] py-16" aria-busy />;

  if (lines.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="text-muted mt-3">Pop something in your cart and come back — we&apos;ll be here.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="container-page grid gap-10 py-8 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-12" noValidate={false}>
      <input type="hidden" name="cart" value={cartJson} />
      <input type="hidden" name="discountCode" value={applied?.code ?? ""} />

      <div className="space-y-10">
        <div>
          <h1 className="text-3xl sm:text-4xl">Checkout</h1>
          <p className="text-muted mt-1 flex items-center gap-1.5 text-sm">
            <Lock size={14} /> Secure checkout. We never see or store your card details.
          </p>
          {cancelled && (
            <p className="mt-4 rounded-xl bg-wattle-light px-4 py-3 text-sm" role="status">
              Payment was cancelled and you haven&apos;t been charged. Your cart is still here whenever you&apos;re ready.
            </p>
          )}
          {!paymentsLive && (
            <p className="mt-4 rounded-xl border border-dashed border-clay/50 bg-white px-4 py-3 text-sm" role="note">
              <strong>Demo mode:</strong> no payment provider is connected, so orders are created without taking payment. Add
              <code className="mx-1 rounded bg-sand px-1">STRIPE_SECRET_KEY</code> to go live.
            </p>
          )}
        </div>

        <Section n={1} title="Contact">
          <Input name="email" label="Email" type="email" autoComplete="email" required error={err.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="marketingOptIn" className="size-4 accent-[var(--color-gum)]" />
            Email me about new colours and restocks (no spam, promise)
          </label>
        </Section>

        <Section n={2} title="Delivery address">
          <p className="text-muted -mt-2 mb-4 text-sm">We currently deliver within Australia only.</p>
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
                <label htmlFor="state" className="label">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  autoComplete="address-level1"
                  className="field"
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
              <Input name="phone" label="Phone (for the courier, optional)" type="tel" autoComplete="tel" error={err.phone} />
            </div>
          </div>
        </Section>

        <Section n={3} title="Delivery method">
          <div className="space-y-2">
            {quotes.map((q) => (
              <label
                key={q.method}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 bg-white px-4 py-3 transition ${method === q.method ? "border-ink" : "border-line hover:border-muted"}`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="method" value={q.method} checked={method === q.method} onChange={() => setMethod(q.method)} className="size-4 accent-[var(--color-gum)]" />
                  <span>
                    <span className="block font-semibold">{q.label}</span>
                    <span className="text-muted text-sm">
                      {q.eta}
                      {!region && " · choose your state for an exact price"}
                    </span>
                  </span>
                </span>
                <span className="font-semibold">{q.free ? "Free" : formatMoney(q.cents)}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section n={4} title="Make it personal" icon={<Gift size={18} />}>
          <label htmlFor="giftMessage" className="label">
            Add a handwritten note (free)
          </label>
          <textarea
            id="giftMessage"
            name="giftMessage"
            rows={3}
            maxLength={250}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Happy housewarming! Love, Mum x"
            className="field font-hand text-xl"
          />
          <p className="text-muted mt-1 flex justify-between text-xs">
            <span>We&apos;ll write it by hand on one of our cards. Prices are never included in the parcel.</span>
            <span>{note.length}/250</span>
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input type="checkbox" name="giftWrap" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="mt-1 size-4 accent-[var(--color-gum)]" />
            <span>
              <span className="font-semibold">Gift wrap it (+{formatMoney(store.commerce.giftWrapCents)})</span>
              <span className="text-muted block text-sm">Recycled tissue, cotton twine and a sprig of dried gum leaves.</span>
            </span>
          </label>
        </Section>

        {state?.error && (
          <p className="rounded-xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay" role="alert">
            {state.error}
          </p>
        )}

        <div className="lg:hidden">
          <PayButton pending={pending} total={t.total} paymentsLive={paymentsLive} disabled={!!pcMismatch} />
        </div>
      </div>

      {/* ── Summary ───────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
          <h2 className="mb-4 text-xl">Order summary</h2>
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <li key={lineKey(l)} className="flex gap-3 py-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <TextileArt category={l.category} collection={l.collection} pattern={l.pattern} colour={l.colourHex} accent={l.accentHex} imageUrl={l.imageUrl} alt="" />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-muted">{l.variantLabel}</p>
                  {l.monogram && <p className="text-gum">Monogram: {l.monogram}</p>}
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatMoney(lineTotalCents(l))}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <label htmlFor="code" className="sr-only">
              Discount code
            </label>
            <div className="relative flex-1">
              <Tag size={15} className="text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
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
                className="field py-2 pl-9"
                aria-invalid={!!err.discountCode}
              />
            </div>
            <button type="button" onClick={applyCode} disabled={checking || !code} className="btn btn-outline px-4 py-2">
              {checking ? "…" : "Apply"}
            </button>
          </div>
          {codeMsg && (
            <p className={`mt-2 text-sm ${applied ? "text-gum" : "text-clay"}`} role="status">
              {codeMsg}
              {applied && (
                <button
                  type="button"
                  className="text-muted ml-2 underline"
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

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <Row label="Subtotal" value={formatMoney(t.subtotal)} />
            {t.discount > 0 && <Row label={`Discount (${applied?.code})`} value={`−${formatMoney(t.discount)}`} highlight />}
            {t.giftWrap > 0 && <Row label="Gift wrapping" value={formatMoney(t.giftWrap)} />}
            <Row label={t.shipping.label} value={t.shipping.free ? "Free" : region ? formatMoney(t.shipping.cents) : `from ${formatMoney(t.shipping.cents)}`} />
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                <span className="text-muted mr-1 text-xs font-normal">AUD</span>
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
            <p className="text-muted mt-3 text-center text-xs">
              Or pay in 4 × {formatMoney(afterpayInstalment(t.total))} with Afterpay on the next step
            </p>
          )}
        </div>
        <p className="text-muted mt-4 px-2 text-center text-xs">
          By placing your order you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>. {store.commerce.returnDays}-day returns ·{" "}
          <Link href="/returns" className="underline">details</Link>
        </p>
      </aside>
    </form>
  );
}

function Section({ n, title, icon, children }: { n: number; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-3 text-xl">
        <span className="grid size-7 place-items-center rounded-full bg-gum font-sans text-sm font-bold text-white">{n}</span>
        {title}
        {icon && <span className="text-gum">{icon}</span>}
      </h2>
      {children}
    </section>
  );
}

function Input({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className="field" aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} {...rest} />
      {error && (
        <p id={`${name}-err`} className="mt-1 text-sm text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted text-xs" : ""}`}>
      <dt>{label}</dt>
      <dd className={`tabular-nums ${highlight ? "font-semibold text-gum" : ""}`}>{value}</dd>
    </div>
  );
}

function PayButton({ pending, total, paymentsLive, disabled }: { pending: boolean; total: number; paymentsLive: boolean; disabled: boolean }) {
  return (
    <button className="btn btn-primary w-full py-4 text-base" disabled={pending || disabled}>
      <Lock size={16} />
      {pending ? "Just a moment…" : paymentsLive ? `Continue to payment · ${formatMoney(total)}` : `Place demo order · ${formatMoney(total)}`}
    </button>
  );
}
