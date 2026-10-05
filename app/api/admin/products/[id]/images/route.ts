import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { staffFor } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { saveUpload, UploadError } from "@/lib/uploads";

// Adds one photo to a product. The admin page sends files one at a time, so
// a slow connection only ever has a single photo in flight.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/products/[id]/images">) {
  const staff = await staffFor("products");
  if (!staff) return Response.json({ error: "Your admin session has ended, or your role can't edit products. Log in again." }, { status: 401 });

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, images: { select: { sortOrder: true } } },
  });
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

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
      data: { productId: product.id, url, alt: colourName ? `${product.name} in ${colourName}` : product.name, colourName, sortOrder },
    });
    // The product now belongs to the shop owner, not the sample catalogue
    await prisma.product.update({ where: { id: product.id }, data: { fromSeed: false } });
    await audit(staff, "product.photos", product.name, { href: `/admin/products/${product.id}`, detail: colourName ? `Added a photo for ${colourName}` : "Added a photo" });
    revalidatePath(`/products/${product.slug}`);
    return Response.json({ id: image.id, url });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: 400 });
    console.error("[upload]", e);
    return Response.json({ error: "Something went wrong saving that photo." }, { status: 500 });
  }
}
