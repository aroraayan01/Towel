import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Fraunces } from "next/font/google";

import { store } from "@/lib/store";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(store.url),
  title: {
    default: `${store.name} — ${store.tagline}`,
    template: `%s | ${store.name}`,
  },
  description: store.description,
  applicationName: store.name,
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: store.name,
    title: `${store.name} — ${store.tagline}`,
    description: store.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#3f5b4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${fraunces.variable} ${figtree.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
