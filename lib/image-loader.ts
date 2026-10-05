/**
 * next/image loader. Unsplash (and any imgix-style CDN) resizes on its own
 * servers, so we ask it for the exact width instead of re-processing.
 * Anything else is served as-is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 72));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  // Photos uploaded in /admin are resized by our own /uploads route
  if (src.startsWith("/uploads/")) return `${src}?w=${width}`;
  return src;
}
