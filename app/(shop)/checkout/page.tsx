import type { Metadata } from "next";

import { paymentsLive } from "@/lib/stripe";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { cancelled } = await searchParams;
  return <CheckoutForm paymentsLive={paymentsLive()} cancelled={cancelled === "1"} />;
}
