import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="page-x py-24 md:py-32">
      <p className="caps text-grey">404</p>
      <h1 className="wide mt-4 text-3xl md:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-grey">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-dark">
          Shop all
        </Link>
        <Link href="/" className="btn btn-line">
          Home
        </Link>
      </div>
    </div>
  );
}
