import type { Metadata } from "next";
import Link from "next/link";

import { checkoutOpen, paymentsLive } from "@/lib/stripe";
import { store } from "@/lib/store";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { cancelled } = await searchParams;

  if (!checkoutOpen()) {
    return (
      <div className="page-x py-20 md:py-28">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="wide text-3xl md:text-4xl">Online checkout opens soon</h1>
          <p className="mt-4 text-grey">
            We&apos;re not taking orders on the website just yet. Your bag is saved on this device. For anything you&apos;d like
            now, email{" "}
            <a className="link" href={`mailto:${store.email}`}>
              {store.email}
            </a>
            .
          </p>
          <Link href="/cart" className="btn-line mt-8 inline-flex">
            Back to bag
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutForm paymentsLive={paymentsLive()} cancelled={cancelled === "1"} />;
}
