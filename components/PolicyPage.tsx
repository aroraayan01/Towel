import { PageTitle } from "@/components/ui";

export function PolicyPage({ title, intro, updated, children }: { title: string; intro?: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <PageTitle title={title} intro={intro} />
      <div className="page-x pb-24">
        <article className="prose-page">
          {updated && <p className="!text-[13px] !text-grey">Last updated {updated}</p>}
          {children}
        </article>
      </div>
    </>
  );
}
