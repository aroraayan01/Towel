import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";

import { store } from "@/lib/store";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  metadataBase: new URL(store.url),
  title: {
    default: `${store.name} | Bath, bedding, rugs and leather, designed in Australia`,
    template: `%s | ${store.name}`,
  },
  description: store.description,
  applicationName: store.name,
  openGraph: { type: "website", locale: "en_AU", siteName: store.name },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${archivo.variable} ${bodoni.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
