import Link from "next/link";

import { AdminTitle } from "@/app/admin/ui";
import { ProductEditor } from "@/components/catalogue/ProductEditor";
import { requireSeller } from "@/lib/seller-auth";
import { sellerSaveProduct } from "../../actions";

export default async function SellerNewProductPage() {
  await requireSeller();
  return (
    <>
      <Link href="/seller/products" className="text-grey text-sm hover:underline">
        ← Products
      </Link>
      <AdminTitle title="New product" sub="Describe it exactly as it is. Save, add your photos, and we'll check it before it goes live." />
      <ProductEditor
        mode="seller"
        save={sellerSaveProduct}
        product={{
          name: "",
          slug: "",
          category: "bath",
          collection: "bath-towels",
          tagline: "",
          description: "",
          details: [],
          specs: [],
          material: "",
          care: "",
          active: true,
          featured: false,
          bestseller: false,
          isNew: false,
          monogramable: false,
          variants: [],
        }}
      />
    </>
  );
}
