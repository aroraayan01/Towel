import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Product photos uploaded in /admin.
 *
 * They live on disk outside the build (in Docker that's /data/uploads, on the
 * same volume as the database) so they survive deploys. Each upload is
 * auto-rotated, capped at 2400px and stored as WebP under a random name; the
 * /uploads route then serves resized copies, cached next to the original.
 */
// Paths here are only known at run time; the ignore comments stop the bundler
// from tracing the whole project into the server build because of them.
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
const CACHE_DIR = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, "cache");

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 2400;

/** Widths next/image asks for (Next's default deviceSizes + imageSizes). */
export const ALLOWED_WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);

/** Upload file names are always a UUID plus .webp, which also rules out path tricks. */
export const UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export const uploadUrl = (name: string) => `/uploads/${name}`;
export const isUploadUrl = (url: string) => url.startsWith("/uploads/");

export class UploadError extends Error {}

/** Validates and stores one image. Returns its public URL. */
export async function saveUpload(input: Buffer): Promise<string> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Photos can be up to 20 MB.");

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("That file isn't an image we can read. Use JPG, PNG or WebP. (iPhone HEIC files: export them as JPEG first.)");
  }
  if (!meta.width || !meta.height) throw new UploadError("That file isn't an image we can read.");
  if (meta.width < 400 || meta.height < 400) {
    throw new UploadError(`That photo is only ${meta.width}×${meta.height}px. Use at least 1200px on the short side so it looks sharp.`);
  }

  const out = await sharp(input)
    .rotate() // respect the phone's orientation flag
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();

  await mkdir(UPLOADS_DIR, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), out);
  return uploadUrl(name);
}

/** Path of the file to send for a request, creating the resized copy on first use. */
export async function resolveUpload(name: string, width: number | null): Promise<string | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  const original = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name);
  try {
    await stat(original);
  } catch {
    return null;
  }
  if (!width || !ALLOWED_WIDTHS.has(width)) return original;

  const cached = path.join(/*turbopackIgnore: true*/ CACHE_DIR, `${name.slice(0, -5)}-${width}.webp`);
  try {
    await stat(cached);
    return cached;
  } catch {
    await mkdir(CACHE_DIR, { recursive: true });
    const buf = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(cached, buf);
    return cached;
  }
}

/** Removes an uploaded photo and its resized copies. Ignores URLs that aren't uploads. */
export async function deleteUpload(url: string) {
  if (!isUploadUrl(url)) return;
  const name = url.slice("/uploads/".length);
  if (!UPLOAD_NAME.test(name)) return;
  await rm(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), { force: true });
  const stem = name.slice(0, -5);
  const cached = await readdir(CACHE_DIR).catch(() => [] as string[]);
  await Promise.all(cached.filter((f) => f.startsWith(`${stem}-`)).map((f) => rm(path.join(/*turbopackIgnore: true*/ CACHE_DIR, f), { force: true })));
}
