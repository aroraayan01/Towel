"use client";

import { useActionState } from "react";

import { sellerLogin } from "../actions";

export function SellerLoginForm() {
  const [error, action, pending] = useActionState(sellerLogin, null);
  return (
    <form action={action} className="mt-5 space-y-4">
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" autoFocus />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {error && (
        <p className="text-sale text-sm" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-dark w-full" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
