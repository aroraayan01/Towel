import { store } from "@/lib/store";

/**
 * The xomexo mark: an X over a forest-green tile with a brass centre, the same
 * drawing as app/icon.svg and the logo on the original xomexo.com site.
 * On the dark footer the tile switches to a darker green with a thin outline,
 * so it doesn't disappear into the background.
 */
export function LogoMark({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={`shrink-0 ${className}`}>
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        fill={tone === "dark" ? "#143a2f" : "#1d4d3f"}
        stroke={tone === "dark" ? "rgba(255,255,255,0.22)" : "none"}
        strokeWidth="2"
      />
      <path d="M18 18l28 28M46 18L18 46" stroke="#f4f6f4" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="32" r="7" fill="#a9822f" />
    </svg>
  );
}

/** Mark plus the name set in the display serif. */
export function Wordmark({
  className = "",
  tone = "light",
  mark = true,
}: {
  className?: string;
  tone?: "light" | "dark";
  mark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 md:gap-3 ${className}`}>
      {mark && <LogoMark tone={tone} className="size-7 md:size-[34px]" />}
      <span className="wide block text-[19px] leading-none tracking-[0.3em] uppercase md:text-[24px] md:tracking-[0.34em]">
        {store.name}
      </span>
    </span>
  );
}
