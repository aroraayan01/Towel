import { PageHeader } from "@/components/ui";

export function PolicyPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow="Help" title={title} intro={intro} />
      <div className="container-page py-12">
        <article className="prose-page">
          {updated && <p className="text-muted text-sm">Last updated {updated}</p>}
          {children}
        </article>
      </div>
    </>
  );
}
