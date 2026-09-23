"use client";

import Link from "next/link";
import { useEffect } from "react";

import { store } from "@/lib/store";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page max-w-2xl py-24 text-center">
      <p className="font-hand text-3xl text-gum">Well, that&apos;s not right.</p>
      <h1 className="mt-2 text-4xl">Something went wrong on our end</h1>
      <p className="text-muted mt-4">
        Sorry about that. Please try again — and if it keeps happening, email us at{" "}
        <a href={`mailto:${store.email}`} className="underline">{store.email}</a>
        {error.digest && ` and mention code ${error.digest}`}.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
