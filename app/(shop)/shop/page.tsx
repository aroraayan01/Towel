import type { Metadata } from "next";

import { ShopListing } from "@/components/product/ShopListing";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Bath towels, beach towels, bath mats, wool and jute rugs and hallway runners, delivered Australia-wide.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <ShopListing
      title="Shop all"
      intro="Towels, rugs, runners and bath mats."
      searchParams={await searchParams}
      basePath="/shop"
    />
  );
}
