"use client";

import { useActionState } from "react";

import { ActionForm } from "../ActionForm";
import { approveSeller, rejectSeller } from "./actions";

/**
 * Approve or decline an application. It stays mounted after approving, even
 * though the seller is no longer pending, so the one-time login details stay
 * on screen until the page is left.
 */
export function DecisionPanel({
  sellerId,
  sellerName,
  status,
  commission,
  previousNote,
}: {
  sellerId: string;
  sellerName: string;
  status: string;
  commission: number;
  previousNote: string | null;
}) {
  const [state, approve, pending] = useActionState(approveSeller, null);

  if (state?.credentials) {
    const text = `Seller portal: ${location.origin}/seller/login\nEmail: ${state.credentials.email}\nTemporary password: ${state.credentials.password}\nYou'll choose your own password when you first log in.`;
    return (
      <section className="border-forest/40 bg-forest/5 border p-5 text-sm" role="status">
        <p className="font-semibold">{state.ok}</p>
        <p className="mt-1">If email isn&apos;t set up yet, send them these details yourself. The password is only shown here once.</p>
        <pre className="mt-3 overflow-x-auto bg-white p-3 font-mono text-[13px] whitespace-pre-wrap">{text}</pre>
        <button type="button" className="btn btn-line mt-2 h-9 px-4 text-[12px]" onClick={() => navigator.clipboard.writeText(text)}>
          Copy
        </button>
      </section>
    );
  }
  if (status !== "pending" && status !== "rejected") return null;

  return (
    <section className="border-line border bg-white p-5">
      <h2 className="mb-3 font-sans text-[15px] font-semibold">Decision</h2>
      {previousNote && <p className="text-grey mb-3 text-sm">Previously declined: {previousNote}</p>}
      <form action={approve} className="space-y-3">
        <input type="hidden" name="id" value={sellerId} />
        <label className="block">
          <span className="field-label">Commission %</span>
          <input name="commission" defaultValue={commission} className="input w-28" inputMode="decimal" />
        </label>
        <button className="btn btn-dark" disabled={pending}>
          {pending ? "Working…" : "Approve and send login"}
        </button>
        {state?.error && (
          <p className="text-sale text-sm" role="alert">
            {state.error}
          </p>
        )}
      </form>
      {status === "pending" && (
        <div className="mt-6 border-t border-line pt-5">
          <ActionForm action={rejectSeller} hidden={{ id: sellerId }} submit="Decline application" danger confirmText={`Decline ${sellerName}'s application? They're emailed.`}>
            <label className="block">
              <span className="field-label">Reason (optional, included in the email)</span>
              <textarea name="note" rows={3} className="input" maxLength={1000} />
            </label>
          </ActionForm>
        </div>
      )}
    </section>
  );
}
