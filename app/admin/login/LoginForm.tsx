"use client";

import { useActionState } from "react";

import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" autoFocus />
      </div>
      {error && (
        <p className="text-sm text-sale" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-dark w-full" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
