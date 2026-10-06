"use client";

import Link from "next/link";
import { useActionState } from "react";

import { CATEGORIES, CATEGORY_ORDER } from "@/lib/collections";
import { STATES } from "@/lib/shipping";
import { applyToSell, type ApplyState } from "./actions";

export function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToSell, null);
  const err = state?.errors ?? {};
  const v = state?.values ?? {};
  const val = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : undefined);

  if (state?.ok) {
    return (
      <div className="bg-bone p-8" role="status">
        <p className="text-lg">Application sent.</p>
        <p className="mt-2 text-grey">{state.message}</p>
      </div>
    );
  }

  return (
    // Remounted after each attempt so the fields show what was typed
    <form key={JSON.stringify(v)} action={action} className="space-y-10">
      <input name="fax" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-[15px]">Your business</legend>
        <Field name="name" defaultValue={val("name")} label="Business or brand name" error={err.name} required autoComplete="organization" />
        <Field name="contactName" defaultValue={val("contactName")} label="Your name" error={err.contactName} required autoComplete="name" />
        <Field name="email" defaultValue={val("email")} label="Email" type="email" error={err.email} required autoComplete="email" />
        <Field name="phone" defaultValue={val("phone")} label="Phone (optional)" type="tel" error={err.phone} autoComplete="tel" />
        <Field name="abn" defaultValue={val("abn")} label="ABN" error={err.abn} required inputMode="numeric" placeholder="11 digits" />
        <Field name="legalName" defaultValue={val("legalName")} label="Legal name, if different (optional)" error={err.legalName} />
        <div className="sm:col-span-2">
          <p className="field-label">Registered for GST?</p>
          <div className="flex gap-6 text-[14px]">
            {[
              ["yes", "Yes"],
              ["no", "No"],
            ].map(([value, l]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="gstRegistered" value={value} defaultChecked={val("gstRegistered") === value} className="accent-forest size-4" required />
                {l}
              </label>
            ))}
          </div>
          {err.gstRegistered && <p className="mt-1 text-[13px] text-sale">{err.gstRegistered}</p>}
        </div>
        <Field name="website" defaultValue={val("website")} label="Website (optional)" error={err.website} placeholder="yourshop.com.au" />
        <Field name="instagram" defaultValue={val("instagram")} label="Instagram (optional)" error={err.instagram} placeholder="@yourshop" />
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-[15px]">What you make</legend>
        <p className="field-label">Categories</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {CATEGORY_ORDER.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input type="checkbox" name="categories" value={c} defaultChecked={Array.isArray(v.categories) && v.categories.includes(c)} className="accent-forest size-4" />
              {CATEGORIES[c].name}
            </label>
          ))}
        </div>
        {err.categories && <p className="mt-1 text-[13px] text-sale">{err.categories}</p>}
        <label htmlFor="application" className="field-label mt-5">
          Tell us about your products
        </label>
        <textarea
          id="application"
          name="application"
          rows={6}
          required
          maxLength={3000}
          defaultValue={val("application")}
          className="input"
          placeholder="What you make, what it's made from, where it's made, roughly how many you have, and your price range."
          aria-invalid={!!err.application}
        />
        {err.application && <p className="mt-1 text-[13px] text-sale">{err.application}</p>}
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-[1.4fr_1fr_0.8fr]">
        <legend className="mb-4 text-[15px]">Where you ship from</legend>
        <Field name="shipFromSuburb" defaultValue={val("shipFromSuburb")} label="Suburb" error={err.shipFromSuburb} required autoComplete="address-level2" />
        <div>
          <label htmlFor="shipFromState" className="field-label">
            State
          </label>
          <select id="shipFromState" name="shipFromState" required defaultValue={val("shipFromState") ?? ""} className="input" aria-invalid={!!err.shipFromState}>
            <option value="" disabled>
              Choose
            </option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
          {err.shipFromState && <p className="mt-1 text-[13px] text-sale">{err.shipFromState}</p>}
        </div>
        <Field name="shipFromPostcode" defaultValue={val("shipFromPostcode")} label="Postcode" error={err.shipFromPostcode} required inputMode="numeric" maxLength={4} autoComplete="postal-code" />
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-[14px]">
          <input type="checkbox" name="agree" defaultChecked={val("agree") === "on"} className="accent-forest mt-1 size-4" required />
          <span>
            I&apos;ve read and accept the{" "}
            <Link href="/sell/terms" target="_blank" className="link">
              seller terms
            </Link>
            , including the commission and how payments work.
          </span>
        </label>
        {err.agree && <p className="mt-1 text-[13px] text-sale">{err.agree}</p>}
      </div>

      {state && !state.ok && (
        <p className="text-[14px] text-sale" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn btn-dark" disabled={pending}>
        {pending ? "Sending…" : "Send application"}
      </button>
    </form>
  );
}

function Field({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input id={name} name={name} className="input" aria-invalid={!!error} {...rest} />
      {error && <p className="mt-1 text-[13px] text-sale">{error}</p>}
    </div>
  );
}
