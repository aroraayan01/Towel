import Link from "next/link";

import { TextileArt } from "@/components/TextileArt";

export function NotFoundContent() {
  return (
    <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
      <div className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl shadow-lg">
        <TextileArt category="towels" collection="beach-towels" pattern="stripe" colour="#E08E79" accent="#FBF1EC" alt="A lonely beach towel" />
      </div>
      <div>
        <p className="font-hand text-3xl text-gum">Oops!</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">This page has gone to the beach.</h1>
        <p className="text-muted mt-4 text-lg">
          We couldn&apos;t find what you were looking for. It may have moved, sold out for good, or never existed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop everything
          </Link>
          <Link href="/" className="btn btn-outline">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
