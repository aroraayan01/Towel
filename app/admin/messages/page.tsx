import { requireStaff } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { markMessage } from "../actions";
import { AdminTitle, card } from "../ui";

export default async function AdminMessagesPage() {
  await requireStaff("messages");
  const messages = await prisma.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });

  return (
    <>
      <AdminTitle title="Messages" sub="From the contact form. Reply by email, then mark as done." />
      <div className="space-y-4">
        {messages.map((m) => (
          <article key={m.id} className={`${card} ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {m.name} · <a href={`mailto:${m.email}?subject=Re: your message to us`} className="underline">{m.email}</a>
                {m.orderRef && <span className="ml-2 rounded bg-bone px-2 text-xs">Order {m.orderRef}</span>}
              </p>
              <span className="text-grey text-xs">{m.createdAt.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{m.message}</p>
            <form action={markMessage} className="mt-3">
              <input type="hidden" name="id" value={m.id} />
              <button className="btn btn-line h-9 px-4 text-[12px]">{m.handled ? "Mark as open" : "Mark as done"}</button>
            </form>
          </article>
        ))}
        {!messages.length && <p className="text-grey">No messages yet.</p>}
      </div>
    </>
  );
}
