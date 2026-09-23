"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["rating", "Top rated"],
] as const;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Sort by</span>
      <select
        className="cursor-pointer border border-line bg-white px-3 py-2 hover:border-ink"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "featured") next.delete("sort");
          else next.set("sort", e.target.value);
          router.push(`${pathname}?${next}`, { scroll: false });
        }}
      >
        {OPTIONS.map(([v, label]) => (
          <option key={v} value={v}>
            Sort: {label}
          </option>
        ))}
      </select>
    </label>
  );
}
