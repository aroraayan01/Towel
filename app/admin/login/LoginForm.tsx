"use client";

import { useActionState } from "react";

import { MIN_PASSWORD } from "@/lib/password-rules";
import { login, setupOwner } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 space-y-4">
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
        <p className="text-sm text-sale" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-dark w-full" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
      <p className="text-grey text-xs">Forgotten your password? Ask the shop owner to reset it.</p>
    </form>
  );
}

export function OwnerSetupForm() {
  const [error, action, pending] = useActionState(setupOwner, null);
  return (
    <form action={action} className="mt-5 space-y-4">
      <div>
        <label htmlFor="serverPassword" className="field-label">
          Current admin password
        </label>
        <input id="serverPassword" name="serverPassword" type="password" required autoComplete="off" className="input" autoFocus />
      </div>
      <hr className="border-line" />
      <div>
        <label htmlFor="name" className="field-label">
          Your name
        </label>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Your email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          New password
        </label>
        <input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="input" />
        <p className="text-grey mt-1 text-xs">At least {MIN_PASSWORD} characters. A few random words works well.</p>
      </div>
      {error && (
        <p className="text-sm text-sale" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-dark w-full" disabled={pending}>
        {pending ? "Setting up…" : "Create owner account"}
      </button>
    </form>
  );
}
