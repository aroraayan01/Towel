import type { Metadata } from "next";

import { ShopListing } from "@/components/product/ShopListing";

export const metadata: Metadata = {
  title: "Shop all towels & rugs",
  description: "Bath towels, beach towels, bath mats, wool and jute rugs and hallway runners — shipped Australia-wide.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <ShopListing
      title="Shop everything"
      eyebrow="The whole range"
      intro="Every towel, rug and mat we make. Free standard shipping on orders over $150."
      searchParams={await searchParams}
      basePath="/shop"
    />
  );
}
