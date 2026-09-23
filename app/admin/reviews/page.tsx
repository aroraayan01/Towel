import { Stars } from "@/components/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { moderateReview } from "../actions";
import { AdminTitle, card } from "../ui";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const [pending, recent] = await Promise.all([
    prisma.review.findMany({ where: { approved: false }, include: { product: true }, orderBy: { createdAt: "asc" } }),
    prisma.review.findMany({ where: { approved: true }, include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <AdminTitle
        title="Reviews"
        sub="Publish honest reviews, including critical ones. Under Australian Consumer Law, hiding genuine negative reviews can be misleading."
      />
      <h2 className="mb-3 text-xl">Waiting for you ({pending.length})</h2>
      <div className="space-y-4">
        {pending.map((r) => (
          <ReviewCard key={r.id} r={r} pending />
        ))}
        {!pending.length && <p className="text-muted">All caught up.</p>}
      </div>
      <h2 className="mt-10 mb-3 text-xl">Recently published</h2>
      <div className="space-y-4">
        {recent.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
    </>
  );
}

function ReviewCard({
  r,
  pending,
}: {
  r: { id: string; name: string; location: string | null; rating: number; title: string; body: string; createdAt: Date; product: { name: string } };
  pending?: boolean;
}) {
  return (
    <article className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars rating={r.rating} />
        <span className="text-muted text-xs">{r.product.name} · {r.createdAt.toLocaleDateString("en-AU")}</span>
      </div>
      <h3 className="mt-2 font-sans font-semibold">{r.title}</h3>
      <p className="mt-1 text-sm text-[#463f39]">{r.body}</p>
      <p className="text-muted mt-1 text-xs">{r.name}{r.location && `, ${r.location}`}</p>
      <form action={moderateReview} className="mt-3 flex gap-2">
        <input type="hidden" name="id" value={r.id} />
        {pending && <button name="action" value="approve" className="btn btn-primary px-4 py-1.5 text-sm">Publish</button>}
        <button name="action" value="delete" className="btn btn-outline px-4 py-1.5 text-sm">Delete</button>
      </form>
    </article>
  );
}
