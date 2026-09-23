"use client";

import { useActionState } from "react";

import { subscribe, type FormState } from "@/app/actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);

  if (state?.ok) {
    return (
      <p className="border border-line px-4 py-3 text-[14px]" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action}>
      <div className="flex">
        <label htmlFor="nl-email" className="sr-only">
          Email address
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="input border-r-0"
          aria-invalid={state && !state.ok ? true : undefined}
        />
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button className="btn btn-dark shrink-0 px-5" disabled={pending}>
          {pending ? "…" : "Sign up"}
        </button>
      </div>
      {state && !state.ok && (
        <p className="mt-2 text-[13px] text-sale" role="alert">
          {state.message}
        </p>
      )}
      <p className="mt-2 text-[12px] text-grey">
        Unsubscribe any time. <Link href="/privacy">Privacy policy</Link>.
      </p>
    </form>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="link">
      {children}
    </a>
  );
}
