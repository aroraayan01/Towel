import type { Metadata } from "next";

import { PageHeader } from "@/components/ui";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="Your wishlist" intro="Tap the heart on anything you love and it'll wait for you here." />
      <div className="container-page py-12">
        <WishlistView />
      </div>
    </>
  );
}
