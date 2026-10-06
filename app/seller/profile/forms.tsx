"use client";

import { useActionState } from "react";

import { STATES } from "@/lib/shipping";
import { updateBankDetails, updateSellerProfile, type PortalState } from "../actions";

type Profile = {
  name: string;
  bio: string;
  phone: string;
  website: string;
  instagram: string;
  dispatchDays: number;
  shipFromSuburb: string;
  shipFromState: string;
  shipFromPostcode: string;
  abn: string;
  legalName: string;
  gstRegistered: boolean;
};

function Message({ state }: { state: PortalState }) {
  if (state?.error)
    return (
      <p className="text-sale text-sm" role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className="text-forest text-sm" role="status">
        {state.ok}
      </p>
    );
  return null;
}

function Field({ label, hint, ...rest }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input className="input" {...rest} />
      {hint && <span className="text-grey mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ seller }: { seller: Profile }) {
  const [state, action, pending] = useActionState(updateSellerProfile, null);
  return (
    // Keyed on the result so the saved values show after React resets the form
    <form key={JSON.stringify(state)} action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name" name="name" defaultValue={seller.name} required maxLength={80} />
        <Field label="Phone (for us, not shown)" name="phone" defaultValue={seller.phone} type="tel" maxLength={20} />
        <Field label="Website" name="website" defaultValue={seller.website} placeholder="yourshop.com.au" />
        <Field label="Instagram" name="instagram" defaultValue={seller.instagram} placeholder="@yourshop" />
      </div>
      <label className="block">
        <span className="field-label">About your shop</span>
        <textarea name="bio" defaultValue={seller.bio} rows={5} maxLength={2000} className="input" placeholder="Who you are, what you make and how. Shown on your shop page." />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <Field label="Ship from suburb" name="shipFromSuburb" defaultValue={seller.shipFromSuburb} required />
        <label className="block">
          <span className="field-label">State</span>
          <select name="shipFromState" defaultValue={seller.shipFromState} className="input" required>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
        </label>
        <Field label="Postcode" name="shipFromPostcode" defaultValue={seller.shipFromPostcode} required inputMode="numeric" maxLength={4} />
        <Field label="Dispatch time (business days)" name="dispatchDays" type="number" min={1} max={10} defaultValue={seller.dispatchDays} required hint="Shown on your products" />
      </div>

      <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <Field label="ABN" name="abn" defaultValue={seller.abn} required inputMode="numeric" />
        <Field label="Legal name, if different from shop name" name="legalName" defaultValue={seller.legalName} />
        <div className="sm:col-span-2">
          <span className="field-label">Registered for GST?</span>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="gstRegistered" value="yes" defaultChecked={seller.gstRegistered} className="accent-forest size-4" />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="gstRegistered" value="no" defaultChecked={!seller.gstRegistered} className="accent-forest size-4" />
              No
            </label>
          </div>
          <p className="text-grey mt-1 text-xs">Decides whether GST appears on invoices for your products. Keep it up to date.</p>
        </div>
      </div>

      <Message state={state} />
      <button className="btn btn-dark" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function BankForm({ hasAccount }: { hasAccount: boolean }) {
  const [state, action, pending] = useActionState(updateBankDetails, null);
  return (
    <form key={JSON.stringify(state)} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1.5fr_0.8fr_1fr]">
        <Field label="Account name" name="accountName" required maxLength={80} autoComplete="off" />
        <Field label="BSB" name="bsb" required inputMode="numeric" placeholder="000-000" maxLength={7} autoComplete="off" />
        <Field label="Account number" name="account" required inputMode="numeric" maxLength={12} autoComplete="off" />
      </div>
      <Field label="Your password, to confirm" name="password" type="password" required autoComplete="current-password" />
      <Message state={state} />
      <button className="btn btn-dark" disabled={pending}>
        {pending ? "Saving…" : hasAccount ? "Change bank account" : "Save bank account"}
      </button>
    </form>
  );
}
