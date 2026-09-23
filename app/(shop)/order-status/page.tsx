import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your order with your order number and email address.",
};

async function lookup(form: FormData) {
  "use server";
  const number = String(form.get("number") ?? "").trim().toUpperCase();
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
      <PageHeader eyebrow="Help" title="Track your order" intro="Pop in your order number and the email you used at checkout." />
      <div className="container-page py-12">
        <form action={lookup} className="max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <div>
            <label htmlFor="number" className="label">
              Order number
            </label>
            <input id="number" name="number" required placeholder="WW-10001" className="field uppercase" />
          </div>
          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="field" />
          </div>
          {e && (
            <p className="text-sm text-clay" role="alert">
              {e === "limit"
                ? "Too many lookups — please wait a few minutes."
                : "We couldn't find an order with those details. Check your confirmation email, or contact us and we'll help."}
            </p>
          )}
          <button className="btn btn-primary w-full">Find my order</button>
        </form>
      </div>
    </>
  );
}
