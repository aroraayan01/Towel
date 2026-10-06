import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "./prisma";
import { safeEqual, sign } from "./session-crypto";

/**
 * Seller portal sessions (/seller). Same design as staff sessions in
 * lib/admin-auth.ts, with its own cookie and a "seller:" signing prefix so a
 * staff cookie can never pass as a seller one or the other way round.
 */
const COOKIE = "xo_seller";
const MAX_AGE = 60 * 60 * 12;

const signSeller = (payload: string) => sign(`seller:${payload}`);

export async function startSellerSession(user: { id: string; sessionVersion: number }) {
  const payload = `${user.id}.${user.sessionVersion}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  (await cookies()).set(COOKIE, `${payload}.${signSeller(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSellerSession() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in seller user and their business, or null. Cached per request. */
export const currentSellerUser = cache(async () => {
  if (!process.env.ADMIN_SECRET) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [id, version, exp, sig] = parts;
  if (!safeEqual(sig, signSeller(`${id}.${version}.${exp}`)) || Number(exp) < Date.now() / 1000) return null;

  const user = await prisma.sellerUser.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      sessionVersion: true,
      mustChangePassword: true,
      seller: { select: { id: true, slug: true, name: true, status: true, commissionBps: true, gstRegistered: true } },
    },
  });
  // Suspended or rejected sellers can't get in, whatever their own account says
  if (!user || !user.active || user.sessionVersion !== Number(version) || user.seller.status !== "active") return null;
  return user;
});

export type SellerUserSession = NonNullable<Awaited<ReturnType<typeof currentSellerUser>>>;

/** Call at the top of every seller page AND every seller server action. */
export async function requireSeller(opts: { allowPasswordChange?: boolean } = {}): Promise<SellerUserSession> {
  const user = await currentSellerUser();
  if (!user) redirect("/seller/login");
  if (user.mustChangePassword && !opts.allowPasswordChange) redirect("/seller/account?first=1");
  return user;
}

/** For route handlers: the seller user, or null (send a 401). */
export async function sellerForRoute() {
  const user = await currentSellerUser();
  return user && !user.mustChangePassword ? user : null;
}
