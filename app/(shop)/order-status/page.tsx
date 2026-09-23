import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageTitle } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check the status of your order with your order number and email address.",
};

async function lookup(form: FormData) {
  "use server";
  const number = String(form.get("number") ?? "").replace(/\D/g, "");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (await rateLimited("lookup", 10, 10 * 60_000)) redirect("/order-status?e=limit");
  const order = number && email ? await prisma.order.findFirst({ where: { number, email } }) : null;
  if (!order) redirect("/order-status?e=notfound");
  redirect(`/order/${order.number}?t=${order.accessToken}`);
}

export default async function OrderStatusPage({ searchParams }: PageProps<"/order-status">) {
  const { e } = await searchParams;
  return (
    <>
      <PageTitle title="Track an order" intro="Enter the order number from your confirmation email and the email address you ordered with." />
      <div className="page-x pb-24">
        <form action={lookup} className="max-w-sm space-y-4">
          <div>
            <label htmlFor="number" className="field-label">
              Order number
            </label>
            <input id="number" name="number" required placeholder="e.g. 1001" inputMode="numeric" className="input" />
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          {e && (
            <p className="text-[14px] text-sale" role="alert">
              {e === "limit"
                ? "Too many attempts. Please wait a few minutes."
                : "We couldn't find an order with those details. Check your confirmation email, or contact us."}
            </p>
          )}
          <button className="btn btn-dark w-full">Find order</button>
        </form>
      </div>
    </>
  );
}
