import { store } from "@/lib/store";

/** Text wordmark. Swap for an SVG logo when there is one. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wide block text-[17px] leading-none font-semibold tracking-[0.14em] uppercase md:text-[22px] md:tracking-[0.18em] ${className}`}>
      {store.name}
    </span>
  );
}
