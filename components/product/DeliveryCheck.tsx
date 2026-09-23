"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/money";
import { allQuotes, stateForPostcode } from "@/lib/shipping";

/** Postcode lookup for delivery cost and timing on the product page. */
export function DeliveryCheck() {
  const [postcode, setPostcode] = useState("");
  const state = stateForPostcode(postcode);
  return (
    <div className="mt-4">
      <label htmlFor="pc" className="field-label">
        Check delivery to your postcode
      </label>
      <input
        id="pc"
        inputMode="numeric"
        maxLength={4}
        placeholder="e.g. 3000"
        value={postcode}
        onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="input w-36"
        autoComplete="postal-code"
      />
      {postcode.length === 4 &&
        (state ? (
          <ul className="mt-3 space-y-1" aria-live="polite">
            {allQuotes(state, 0).map((q) => (
              <li key={q.method} className="flex justify-between gap-4">
                <span>
                  {q.label} to {state}, {q.eta}
                </span>
                <span>{formatMoney(q.cents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sale">That isn&apos;t an Australian postcode.</p>
        ))}
    </div>
  );
}
