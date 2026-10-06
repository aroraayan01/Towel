/** Where a seller's product is in review, for lists and the product page. */
export function ReviewBadge({ status, active, changes }: { status: string; active: boolean; changes: boolean }) {
  const [label, cls] =
    status === "pending"
      ? ["Waiting for review", "bg-[#f6eed8] text-[#7a5a00]"]
      : status === "rejected"
        ? ["Needs changes", "bg-sale/10 text-sale"]
        : !active
          ? ["Hidden", "bg-stone text-grey"]
          : ["Live", "bg-forest/10 text-forest"];
  return (
    <span className="whitespace-nowrap">
      <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
      {changes && status === "approved" && <span className="text-grey ml-1.5 text-xs">changes in review</span>}
    </span>
  );
}
