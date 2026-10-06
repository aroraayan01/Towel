import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const COLOURS: Record<OrderStatus, string> = {
  PENDING: "bg-bone text-grey",
  PAID: "bg-[#f6eed8] text-[#7a5a00]",
  PACKED: "bg-[#e3ecf5] text-[#2d5277]",
  PARTLY_SHIPPED: "bg-[#e3ecf5] text-ink",
  SHIPPED: "bg-bone text-ink",
  DELIVERED: "bg-ink text-white",
  CANCELLED: "bg-stone text-grey",
  REFUNDED: "bg-sale/10 text-sale",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${COLOURS[s] ?? ""}`}>{STATUS_LABEL[s] ?? status}</span>;
}

export function AdminTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl">{title}</h1>
      {sub && <p className="text-grey mt-1">{sub}</p>}
    </div>
  );
}

export const card = " bg-white p-5 border border-line";
export const table = "w-full text-left text-sm [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-grey [&_td]:px-3 [&_td]:py-2.5 [&_tbody_tr]:border-t [&_tbody_tr]:border-line";
