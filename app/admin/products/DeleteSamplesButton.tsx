"use client";

import { deleteSampleProducts } from "./actions";

export function DeleteSamplesButton({ count }: { count: number }) {
  return (
    <form
      action={deleteSampleProducts}
      onSubmit={(e) => {
        if (!confirm(`Remove all ${count} sample products from the shop? Products you've added or edited are not affected.`)) e.preventDefault();
      }}
    >
      <button className="btn btn-line h-9 px-4 text-[12px]">Remove sample products</button>
    </form>
  );
}
