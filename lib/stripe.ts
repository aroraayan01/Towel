import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

/** Null when STRIPE_SECRET_KEY is unset — the shop then runs in demo mode. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const paymentsLive = () => Boolean(process.env.STRIPE_SECRET_KEY);
