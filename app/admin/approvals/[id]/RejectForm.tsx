"use client";

import { useActionState } from "react";

import { rejectListing } from "../actions";

export function RejectForm({ id, isNew }: { id: string; isNew: boolean }) {
  const [state, action, pending] = useActionState(rejectListing, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="field-label">What needs to change (the seller sees this)</span>
        <textarea name="note" rows={4} required minLength={5} maxLength={1000} className="input" placeholder="e.g. Please use a photo of the actual throw, and add its dimensions." />
      </label>
      {state?.error && (
        <p className="text-sale text-sm" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-line w-full" disabled={pending}>
        {pending ? "Sending…" : isNew ? "Send back for changes" : "Decline these changes"}
      </button>
      {!isNew && <p className="text-grey text-xs">The proposed text and new photos are discarded; the live version stays up.</p>}
    </form>
  );
}
