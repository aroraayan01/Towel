"use client";

import { useActionState } from "react";

import { MIN_PASSWORD } from "@/lib/password-rules";
import { sellerChangePassword } from "../actions";

export function SellerPasswordForm({ first }: { first: boolean }) {
  const [state, action, pending] = useActionState(sellerChangePassword, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="current" className="field-label">
          {first ? "Temporary password (from your welcome email)" : "Current password"}
        </label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" autoFocus={first} />
      </div>
      <div>
        <label htmlFor="next" className="field-label">
          New password
        </label>
        <input id="next" name="next" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="input" />
        <p className="text-grey mt-1 text-xs">At least {MIN_PASSWORD} characters. A few random words works well.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          New password again
        </label>
        <input id="confirm" name="confirm" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="input" />
      </div>
      {state?.error && (
        <p className="text-sale text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-forest text-sm" role="status">
          {state.ok}
        </p>
      )}
      <button className="btn btn-dark" disabled={pending}>
        {pending ? "Saving…" : first ? "Set password and continue" : "Change password"}
      </button>
    </form>
  );
}
