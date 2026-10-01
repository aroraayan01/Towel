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

/**
 * Whether checkout accepts orders. Without Stripe, orders are marked paid with
 * no money taken, which is fine locally but would let anyone on a public server
 * order stock for free. So production stays closed until Stripe is set up,
 * unless ALLOW_TEST_CHECKOUT=true is set on purpose (e.g. a private staging copy).
 */
export const checkoutOpen = () =>
  paymentsLive() || process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_CHECKOUT === "true";
