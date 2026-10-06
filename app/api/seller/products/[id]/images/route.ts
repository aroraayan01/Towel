import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { sellerForRoute } from "@/lib/seller-auth";
import { saveUpload, UploadError } from "@/lib/uploads";

// A seller adds one photo to one of their own products. It stays hidden from
// the shop until staff approve it (Admin » Approvals).
export async function POST(req: NextRequest, ctx: RouteContext<"/api/seller/products/[id]/images">) {
  const me = await sellerForRoute();
  if (!me) return Response.json({ error: "Your session has ended. Log in again." }, { status: 401 });

  const { id } = await ctx.params;
  const product = await prisma.product.findFirst({
    where: { id, sellerId: me.seller.id },
    select: { id: true, name: true, slug: true, reviewStatus: true, images: { select: { sortOrder: true } } },
  });
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
  if (product.images.length >= 20) return Response.json({ error: "A product can have up to 20 photos." }, { status: 400 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "The upload didn't arrive complete. Try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file was sent." }, { status: 400 });
  const colourName = String(form.get("colourName") ?? "").trim() || null;

  try {
    const url = await saveUpload(Buffer.from(await file.arrayBuffer()));
    const sortOrder = product.images.reduce((m, i) => Math.max(m, i.sortOrder), -1) + 1;
    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        alt: colourName ? `${product.name} in ${colourName}` : product.name,
        colourName,
        sortOrder,
        approved: false,
      },
    });
    // A live product with a new photo needs another look
    if (product.reviewStatus === "approved") await prisma.product.update({ where: { id: product.id }, data: { submittedAt: new Date() } });
    revalidatePath(`/seller/products/${product.id}`);
    return Response.json({ id: image.id, url });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: 400 });
    console.error("[seller upload]", e);
    return Response.json({ error: "Something went wrong saving that photo." }, { status: 500 });
  }
}
