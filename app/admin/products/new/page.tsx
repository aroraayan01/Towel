import Link from "next/link";

import { requireAdmin } from "@/lib/admin-auth";
import { AdminTitle } from "../../ui";
import { ProductEditor } from "../ProductEditor";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/products" className="text-grey text-sm hover:underline">
        ← Products
      </Link>
      <AdminTitle title="New product" sub="Fill in the details and options, then save. You can add photos straight after." />
      <ProductEditor
        product={{
          name: "",
          slug: "",
          category: "bath",
          collection: "bath-towels",
          tagline: "",
          description: "",
          details: [],
          material: "",
          care: "",
          // Hidden until it has photos and has been checked
          active: false,
          featured: false,
          bestseller: false,
          isNew: true,
          monogramable: false,
          variants: [],
        }}
      />
    </>
  );
}
