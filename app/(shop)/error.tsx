"use client";

import Link from "next/link";
import { useEffect } from "react";

import { store } from "@/lib/store";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-x py-24 md:py-32">
      <h1 className="wide text-3xl md:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-grey">
        Please try again. If it keeps happening, email{" "}
        <a href={`mailto:${store.email}`} className="link">
          {store.email}
        </a>
        {error.digest && ` and quote reference ${error.digest}`}.
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn btn-dark">
          Try again
        </button>
        <Link href="/" className="btn btn-line">
          Home
        </Link>
      </div>
    </div>
  );
}
