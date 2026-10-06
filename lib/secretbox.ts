import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encrypts small secrets (sellers' bank details) at rest with AES-256-GCM.
 * The key is derived from ADMIN_SECRET, so the database file on its own is
 * not enough to read them. Changing ADMIN_SECRET makes stored values
 * unreadable: sellers would have to re-enter their bank details.
 */
function key() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SECRET must be set to a random string of 32+ characters");
  return Buffer.from(hkdfSync("sha256", secret, "xomexo", "seller bank details v1", 32));
}

export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function open<T>(sealed: string | null | undefined): T | null {
  if (!sealed) return null;
  try {
    const [v, iv, tag, body] = sealed.split(".");
    if (v !== "v1") return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}
