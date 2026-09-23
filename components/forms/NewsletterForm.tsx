"use client";

import { useActionState } from "react";

import { subscribe, type FormState } from "@/app/actions";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);

  if (state?.ok) {
    return (
      <p className={`rounded-xl px-4 py-3 text-sm font-medium ${dark ? "bg-white/10" : "bg-gum-light text-gum-dark"}`} role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={dark ? "nl-email-f" : "nl-email"} className="sr-only">
          Email address
        </label>
        <input
          id={dark ? "nl-email-f" : "nl-email"}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className={`field ${dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/60" : ""}`}
          aria-invalid={state && !state.ok ? true : undefined}
        />
        {/* honeypot — hidden from people, irresistible to bots */}
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button className={`btn shrink-0 ${dark ? "btn-light" : "btn-primary"}`} disabled={pending}>
          {pending ? "Joining…" : "Get 10% off"}
        </button>
      </div>
      {state && !state.ok && (
        <p className="mt-2 text-sm text-clay" role="alert">
          {state.message}
        </p>
      )}
      <p className={`mt-2 text-xs ${dark ? "text-white/60" : "text-muted"}`}>
        One email a month, tops. Unsubscribe any time. See our <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}
