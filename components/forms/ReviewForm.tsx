"use client";

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
      <p className="bg-bone px-4 py-3 text-[14px]" role="status">
        {state.message}
      </p>
    );
  }
  if (!open) {
    return (
      <button className="btn btn-line" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <fieldset>
        <legend className="field-label">Rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className={`text-2xl leading-none ${(hover || rating) >= n ? "text-ink" : "text-stone"}`}
            >
              ★
            </button>
          ))}
        </div>
        {err.rating && <p className="mt-1 text-[13px] text-sale">{err.rating}</p>}
      </fieldset>

      <Field name="name" label="First name" error={err.name} autoComplete="given-name" />
      <Field name="location" label="Suburb and state (optional)" error={err.location} />
      <Field name="title" label="Title" error={err.title} />
      <div>
        <label htmlFor="body" className="field-label">
          Review
        </label>
        <textarea id="body" name="body" rows={4} className="input" aria-invalid={!!err.body} />
        {err.body && <p className="mt-1 text-[13px] text-sale">{err.body}</p>}
      </div>
      {state && !state.ok && (
        <p className="text-[14px] text-sale" role="alert">
          {state.message}
        </p>
      )}
      <div>
        <button className="btn btn-dark" disabled={pending}>
          {pending ? "Sending…" : "Submit review"}
        </button>
        <p className="mt-2 text-[12px] text-grey">Reviews are checked before they appear. We publish negative reviews too.</p>
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
