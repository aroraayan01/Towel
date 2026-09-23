"use client";

import { useActionState } from "react";

import { sendContact, type FormState } from "@/app/actions";

export function ContactForm({ orderRef, message }: { orderRef?: string; message?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, null);
  const err = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div className="rounded-3xl bg-gum-light p-8" role="status">
        <p className="font-serif text-2xl text-gum-dark">Message received!</p>
        <p className="mt-2 text-gum-dark">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:grid-cols-2 sm:p-8">
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Field name="name" label="Your name" autoComplete="name" error={err.name} required />
      <Field name="email" label="Email" type="email" autoComplete="email" error={err.email} required />
      <div className="sm:col-span-2">
        <Field name="orderRef" label="Order number (if it's about an order)" defaultValue={orderRef} placeholder="WW-10001" error={err.orderRef} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="label">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          defaultValue={message ? `Hi! Could you let me know when this is back in stock: ${message}` : undefined}
          className="field"
          aria-invalid={!!err.message}
        />
        {err.message && <p className="mt-1 text-sm text-clay">{err.message}</p>}
      </div>
      {state && !state.ok && (
        <p className="text-sm text-clay sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function Field({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className="field" aria-invalid={!!error} {...rest} />
      {error && <p className="mt-1 text-sm text-clay">{error}</p>}
    </div>
  );
}
