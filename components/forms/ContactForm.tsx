"use client";

import { useActionState } from "react";

import { sendContact, type FormState } from "@/app/actions";

export function ContactForm({ orderRef, message }: { orderRef?: string; message?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, null);
  const err = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div className="bg-bone p-8" role="status">
        <p className="text-lg">Thanks, your message has been sent.</p>
        <p className="mt-2 text-grey">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Field name="name" label="Name" autoComplete="name" error={err.name} required />
      <Field name="email" label="Email" type="email" autoComplete="email" error={err.email} required />
      <div className="sm:col-span-2">
        <Field name="orderRef" label="Order number (optional)" defaultValue={orderRef} error={err.orderRef} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="field-label">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={7}
          required
          defaultValue={message ? `Please let me know when this is back in stock: ${message}` : undefined}
          className="input"
          aria-invalid={!!err.message}
        />
        {err.message && <p className="mt-1 text-[13px] text-sale">{err.message}</p>}
      </div>
      {state && !state.ok && (
        <p className="text-[14px] text-sale sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <button className="btn btn-dark" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
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
