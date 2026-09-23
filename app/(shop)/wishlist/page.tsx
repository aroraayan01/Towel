import type { Metadata } from "next";

import { PageTitle } from "@/components/ui";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageTitle title="Wishlist" intro="Saved on this device." />
      <div className="page-x pb-24">
        <WishlistView />
      </div>
    </>
  );
}
