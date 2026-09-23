import type Stripe from "stripe";

import { markOrderPaid } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe → us. Point a webhook at https://<your-domain>/api/stripe/webhook
 * with these events:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded   (Afterpay can settle later)
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Payments not configured", { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  if (!orderId) return Response.json({ ignored: true });

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (session.payment_status === "paid") await markOrderPaid(orderId);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED", notes: `Stripe: ${event.type}` },
      });
      break;
  }

  return Response.json({ received: true });
}
