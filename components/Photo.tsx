import Image from "next/image";

/**
 * A product or editorial photo that fills its (positioned, sized) parent.
 * Give the parent an aspect ratio; the photo is cropped to cover it.
 */
export function Photo({
  src,
  alt,
  sizes,
  preload,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={`object-cover ${className}`} />;
}
