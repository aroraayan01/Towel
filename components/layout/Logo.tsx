import { store } from "@/lib/store";

/** Text wordmark in the display serif. Swap for an SVG logo when there is one. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wide block text-[19px] leading-none tracking-[0.3em] uppercase md:text-[24px] md:tracking-[0.34em] ${className}`}>
      {store.name}
    </span>
  );
}
