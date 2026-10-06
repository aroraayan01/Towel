"use client";

import { useState, useTransition } from "react";

import { revealBankDetails } from "../payouts/actions";

/** Full bank details are only fetched when asked for, and each look is logged. */
export function BankReveal({ sellerId, last4 }: { sellerId: string; last4: string | null }) {
  const [details, setDetails] = useState<{ accountName: string; bsb: string; account: string } | null | undefined>(undefined);
  const [pending, start] = useTransition();
  if (!last4) return <p className="text-grey text-sm">No bank details yet. They add them in their seller portal.</p>;
  if (details)
    return (
      <dl className="grid grid-cols-[7rem_1fr] gap-1 font-mono text-sm">
        <dt className="text-grey font-sans">Name</dt>
        <dd>{details.accountName}</dd>
        <dt className="text-grey font-sans">BSB</dt>
        <dd>{details.bsb}</dd>
        <dt className="text-grey font-sans">Account</dt>
        <dd>{details.account}</dd>
      </dl>
    );
  return (
    <div className="flex items-center gap-4 text-sm">
      <span>Account ending {last4}</span>
      <button type="button" className="underline" disabled={pending} onClick={() => start(async () => setDetails(await revealBankDetails(sellerId)))}>
        {pending ? "…" : "Show full details"}
      </button>
      {details === null && <span className="text-sale">Couldn&apos;t read them (was ADMIN_SECRET changed?). Ask the seller to re-enter them.</span>}
    </div>
  );
}
