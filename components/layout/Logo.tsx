import { store } from "@/lib/store";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <circle cx="20" cy="20" r="20" fill={light ? "#faf6f0" : "#3f5b4a"} />
        <g fill="#e3b23c">
          <circle cx="15" cy="14" r="3.4" />
          <circle cx="22.5" cy="11.5" r="3" />
          <circle cx="26.5" cy="17.5" r="3.4" />
          <circle cx="19" cy="19.5" r="3" />
          <circle cx="12.5" cy="21.5" r="2.6" />
        </g>
        <path d="M19 19.5c1.3 5.5 2.4 9.5 3.7 13.5" stroke={light ? "#3f5b4a" : "#faf6f0"} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M10 29.5h20M10 33h20" stroke={light ? "#3f5b4a" : "#faf6f0"} strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      </svg>
      <span className={`font-serif text-xl leading-none sm:text-2xl ${light ? "text-cream" : "text-ink"}`}>{store.name}</span>
    </span>
  );
}
