// No "server-only" here: prisma/staff.ts (the password reset command) uses it too.
// It only touches node:crypto, which never ships to the browser anyway.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

import { MIN_PASSWORD } from "./password-rules";

export { MIN_PASSWORD };

const scrypt = (pw: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(pw, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key))));

// scrypt with OWASP's recommended cost. Stored as scrypt$N$r$p$salt$hash so the
// parameters can be raised later without breaking existing passwords.
const N = 2 ** 17;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 256 * 1024 * 1024;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, n, r, p, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A hash of nothing, checked against when the email isn't found, so both cases take the same time. */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(16).toString("hex")));

/** Readable temporary password, e.g. "kite-amber-4821-solar". The person changes it on first login. */
const WORDS =
  "amber anchor apple arrow aspen basil birch blaze brook cedar chalk cliff clover coast comet coral crane delta dune ember fable fern flint frost gale grove harbor hazel heron iris ivory juniper kelp kite lagoon lark linen lotus maple marsh meadow mesa mint moss nectar oak ochre olive opal orbit otter pearl pebble pine plume prism quartz quill raven reef ridge river robin saffron sage salt shore sierra slate solar spruce stone summit thistle tide timber topaz tulip velvet willow wren".split(
    " "
  );
export function temporaryPassword() {
  const pick = () => WORDS[randomBytes(2).readUInt16BE() % WORDS.length];
  return `${pick()}-${pick()}-${1000 + (randomBytes(2).readUInt16BE() % 9000)}-${pick()}`;
}

/** Returns a reason the password is too weak, or null if it's fine. */
export function passwordProblem(password: string, context: string[] = []) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password.length > 200) return "That's too long.";
  const lower = password.toLowerCase();
  if (context.some((c) => c && c.length >= 3 && lower.includes(c.toLowerCase()))) return "Don't include your name, email or the shop name.";
  if (/^(.)\1+$/.test(password) || ["password123", "qwertyuiop", "1234567890"].some((w) => lower.includes(w))) {
    return "That password is too easy to guess.";
  }
  return null;
}
