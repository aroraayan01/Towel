"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";

import { submitReview, type FormState } from "@/app/actions";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);
  const err = state?.errors ?? {};

  if (state?.ok) {
    return (
      <p className="rounded-xl bg-gum-light px-4 py-3 text-gum-dark" role="status">
        {state.message}
      </p>
    );
  }
  if (!open) {
    return (
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <fieldset className="sm:col-span-2">
        <legend className="label">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="p-0.5"
            >
              <Star size={28} className={(hover || rating) >= n ? "text-wattle" : "text-sand-dark"} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
        </div>
        {err.rating && <p className="mt-1 text-sm text-clay">{err.rating}</p>}
      </fieldset>

      <Field name="name" label="First name" error={err.name} autoComplete="given-name" />
      <Field name="location" label="Suburb, state (optional)" error={err.location} placeholder="e.g. Fremantle, WA" />
      <div className="sm:col-span-2">
        <Field name="title" label="Headline" error={err.title} placeholder="Sum it up in a few words" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="body" className="label">
          Your review
        </label>
        <textarea id="body" name="body" rows={4} className="field" aria-invalid={!!err.body} />
        {err.body && <p className="mt-1 text-sm text-clay">{err.body}</p>}
      </div>
      {state && !state.ok && (
        <p className="text-sm text-clay sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Submit review"}
        </button>
        <p className="text-muted text-xs">We read every review before it goes live, and we publish the good, the bad and the honest.</p>
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
