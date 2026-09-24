"use client";

import { useActionState } from "react";

import { subscribe, type FormState } from "@/app/actions";

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);
  const dark = tone === "dark";

  if (state?.ok) {
    return (
      <p className={`border px-4 py-3 text-[14px] ${dark ? "border-white/20 text-white" : "border-line"}`} role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action}>
      <div className="flex">
        <label htmlFor={`nl-${tone}`} className="sr-only">
          Email address
        </label>
        <input
          id={`nl-${tone}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className={`input border-r-0 ${dark ? "border-white/25 bg-transparent text-white placeholder:text-white/50 focus:border-white" : ""}`}
          aria-invalid={state && !state.ok ? true : undefined}
        />
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button className={`btn shrink-0 px-5 ${dark ? "btn-white" : "btn-dark"}`} disabled={pending}>
          {pending ? "…" : "Sign up"}
        </button>
      </div>
      {state && !state.ok && (
        <p className={`mt-2 text-[13px] ${dark ? "text-[#f3b8ad]" : "text-sale"}`} role="alert">
          {state.message}
        </p>
      )}
      <p className={`mt-2 text-[12px] ${dark ? "text-white/50" : "text-grey"}`}>
        Unsubscribe any time.{" "}
        <a href="/privacy" className="link">
          Privacy policy
        </a>
        .
      </p>
    </form>
  );
}
