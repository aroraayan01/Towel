import { readFile } from "node:fs/promises";
import type { NextRequest } from "next/server";

import { resolveUpload } from "@/lib/uploads";

// Serves product photos uploaded in /admin. ?w= picks a resized copy, which
// lib/image-loader.ts asks for at the width each screen needs.
export async function GET(req: NextRequest, ctx: RouteContext<"/uploads/[name]">) {
  const { name } = await ctx.params;
  const w = Number(req.nextUrl.searchParams.get("w"));
  const file = await resolveUpload(name, Number.isInteger(w) ? w : null);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(await readFile(file)), {
    headers: {
      "Content-Type": "image/webp",
      // File names are random and never reused, so the content never changes
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
