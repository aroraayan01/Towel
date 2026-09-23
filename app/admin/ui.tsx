import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const COLOURS: Record<OrderStatus, string> = {
  PENDING: "bg-sand text-muted",
  PAID: "bg-wattle-light text-[#7a5a00]",
  PACKED: "bg-[#e3ecf5] text-[#2d5277]",
  SHIPPED: "bg-gum-light text-gum-dark",
  DELIVERED: "bg-gum text-white",
  CANCELLED: "bg-sand-dark text-muted",
  REFUNDED: "bg-clay/15 text-clay",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${COLOURS[s] ?? ""}`}>{STATUS_LABEL[s] ?? status}</span>;
}

export function AdminTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl">{title}</h1>
      {sub && <p className="text-muted mt-1">{sub}</p>}
    </div>
  );
}

export const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line";
export const table = "w-full text-left text-sm [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_tbody_tr]:border-t [&_tbody_tr]:border-line";
