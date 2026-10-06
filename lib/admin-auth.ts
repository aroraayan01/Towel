import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "./prisma";
import { safeEqual, sign } from "./session-crypto";
import { can, homeFor, type Permission } from "./staff";

/**
 * Staff sessions for /admin.
 *
 * The cookie holds the staff id, their session version and an expiry, signed
 * with ADMIN_SECRET. Every request re-checks the account, so deactivating
 * someone or changing their password (both bump sessionVersion) logs them
 * out everywhere straight away.
 */
const COOKIE = "ww_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

/**
 * The server's ADMIN_PASSWORD. Only used once: to prove you run the server
 * when creating the first owner account.
 */
export function setupPasswordMatches(given: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMACs so the comparison is constant-time regardless of length
  return safeEqual(sign(`pw:${given}`), sign(`pw:${expected}`));
}

export async function startSession(staff: { id: string; sessionVersion: number }) {
  const payload = `${staff.id}.${staff.sessionVersion}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in staff member, or null. Cached per request. */
export const currentStaff = cache(async () => {
  if (!process.env.ADMIN_SECRET) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [id, version, exp, sig] = parts;
  if (!safeEqual(sig, sign(`${id}.${version}.${exp}`)) || Number(exp) < Date.now() / 1000) return null;

  const staff = await prisma.staffUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, sessionVersion: true, mustChangePassword: true },
  });
  if (!staff || !staff.active || staff.sessionVersion !== Number(version)) return null;
  return staff;
});

export type Staff = NonNullable<Awaited<ReturnType<typeof currentStaff>>>;

/**
 * Call at the top of every admin page AND every admin server action.
 * Sends people to log in, to set their own password, or to the part of
 * admin they're allowed into.
 */
export async function requireStaff(permission?: Permission, opts: { allowPasswordChange?: boolean } = {}): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  if (staff.mustChangePassword && !opts.allowPasswordChange) redirect("/admin/account?first=1");
  if (permission && !can(staff.role, permission)) redirect(homeFor(staff.role));
  return staff;
}

/** For route handlers: the staff member if they're allowed, otherwise null (send a 401/403). */
export async function staffFor(permission: Permission) {
  const staff = await currentStaff();
  return staff && !staff.mustChangePassword && can(staff.role, permission) ? staff : null;
}
