"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff, startSession } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { homeFor } from "@/lib/staff";
import { store } from "@/lib/store";

export type AccountState = { error?: string; ok?: string } | null;

export async function changePassword(_: AccountState, form: FormData): Promise<AccountState> {
  const me = await requireStaff(undefined, { allowPasswordChange: true });
  if (await rateLimited("admin-password", 10, 15 * 60_000)) return { error: "Too many attempts. Wait 15 minutes and try again." };

  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const row = await prisma.staffUser.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(current, row.passwordHash))) return { error: "Your current password isn't right." };
  if (next !== confirm) return { error: "The two new passwords don't match." };
  if (next === current) return { error: "Choose a different password from the current one." };
  const weak = passwordProblem(next, [row.name, row.email.split("@")[0], store.name]);
  if (weak) return { error: weak };

  // A new session version signs out every other device using the old password
  const updated = await prisma.staffUser.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false, sessionVersion: { increment: 1 } },
  });
  await startSession(updated);
  await audit(me, "account.password", me.email, { detail: row.mustChangePassword ? "Set their own password" : "Changed their password" });

  if (row.mustChangePassword) redirect(homeFor(row.role));
  return { ok: "Password changed. Any other devices you were logged in on have been signed out." };
}

export async function updateName(_: AccountState, form: FormData): Promise<AccountState> {
  const me = await requireStaff();
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: "Enter your name." };
  await prisma.staffUser.update({ where: { id: me.id }, data: { name } });
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}
