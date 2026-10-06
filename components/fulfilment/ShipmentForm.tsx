"use client";

import { useState } from "react";

import { CARRIERS, FULFILMENT_STEPS, SHIPMENT_LABEL } from "@/lib/shipments";

type Props = {
  action: (form: FormData) => Promise<void>;
  shipment: { id: string; status: string; carrier: string | null; trackingNumber: string | null };
  /** Staff can cancel a shipment; sellers ask the shop to. */
  allowCancel?: boolean;
};

/** Status, carrier and tracking for one shipment. Used in admin and the seller portal. */
export function ShipmentForm({ action, shipment, allowCancel = false }: Props) {
  const [status, setStatus] = useState(shipment.status === "PENDING" ? "TO_SHIP" : shipment.status);
  const shipping = status === "SHIPPED" || status === "DELIVERED";
  const wasShipped = shipment.status === "SHIPPED" || shipment.status === "DELIVERED";

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        if (status === "CANCELLED" && shipment.status !== "CANCELLED" && !confirm("Cancel this shipment? Any seller earnings on it are reversed. Refund the customer in Stripe separately.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={shipment.id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor={`status-${shipment.id}`} className="field-label">
            Status
          </label>
          <select id={`status-${shipment.id}`} name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            {FULFILMENT_STEPS.map((s) => (
              <option key={s} value={s}>
                {SHIPMENT_LABEL[s]}
              </option>
            ))}
            {allowCancel && <option value="CANCELLED">{SHIPMENT_LABEL.CANCELLED}</option>}
          </select>
        </div>
        <div>
          <label htmlFor={`carrier-${shipment.id}`} className="field-label">
            Carrier
          </label>
          <select id={`carrier-${shipment.id}`} name="carrier" defaultValue={shipment.carrier ?? "Australia Post"} className="input">
            {CARRIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`tracking-${shipment.id}`} className="field-label">
          Tracking number {shipping && <span className="text-sale">(needed so the customer can follow it)</span>}
        </label>
        <input id={`tracking-${shipment.id}`} name="trackingNumber" defaultValue={shipment.trackingNumber ?? ""} required={shipping} maxLength={60} className="input font-mono" />
      </div>
      {status === "SHIPPED" && !wasShipped && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="notify" defaultChecked className="accent-forest size-4" />
          Email the customer the tracking details
        </label>
      )}
      <button className="btn btn-dark w-full">Save</button>
    </form>
  );
}
