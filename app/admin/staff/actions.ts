"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { hashPassword, temporaryPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { ROLE_INFO, isRole, type Role } from "@/lib/staff";

export type StaffState = { error?: string; ok?: string; credentials?: { name: string; email: string; password: string } } | null;

const newStaffSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.string().refine(isRole, "Choose a role"),
});

export async function createStaff(_: StaffState, form: FormData): Promise<StaffState> {
  const me = await requireStaff("staff");
  const parsed = newStaffSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (await prisma.staffUser.findUnique({ where: { email: d.email } })) return { error: `${d.email} already has an account.` };

  const password = temporaryPassword();
  const created = await prisma.staffUser.create({
    data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(password), mustChangePassword: true },
  });
  await audit(me, "staff.create", created.name, { href: "/admin/staff", detail: `${created.email} as ${ROLE_INFO[d.role as Role].name}` });
  revalidatePath("/admin/staff");
  return { credentials: { name: created.name, email: created.email, password } };
}

/** Active owners other than the given account: someone must always be able to manage staff. */
const otherOwners = (id: string) => prisma.staffUser.count({ where: { role: "owner", active: true, NOT: { id } } });

export async function updateStaff(_: StaffState, form: FormData): Promise<StaffState> {
  const me = await requireStaff("staff");
  const id = String(form.get("id"));
  const intent = String(form.get("intent"));
  const target = await prisma.staffUser.findUnique({ where: { id } });
  if (!target) return { error: "That account no longer exists." };
  const self = target.id === me.id;

  if (intent === "role") {
    const role = String(form.get("role"));
    if (!isRole(role)) return { error: "Choose a role." };
    if (role === target.role) return null;
    if (self) return { error: "You can't change your own role. Ask another owner." };
    if (target.role === "owner" && (await otherOwners(id)) === 0) return { error: "There has to be at least one owner." };
    await prisma.staffUser.update({ where: { id }, data: { role } });
    await audit(me, "staff.role", target.name, { href: "/admin/staff", detail: `${ROLE_INFO[target.role as Role]?.name ?? target.role} → ${ROLE_INFO[role].name}` });
    revalidatePath("/admin/staff");
    return { ok: `${target.name} is now ${ROLE_INFO[role].name}.` };
  }

  if (intent === "deactivate") {
    if (self) return { error: "You can't switch off your own account." };
    if (target.role === "owner" && (await otherOwners(id)) === 0) return { error: "There has to be at least one active owner." };
    // Bumping the session version logs them out immediately
    await prisma.staffUser.update({ where: { id }, data: { active: false, sessionVersion: { increment: 1 } } });
    await audit(me, "staff.deactivate", target.name, { href: "/admin/staff" });
    revalidatePath("/admin/staff");
    return { ok: `${target.name} can no longer log in.` };
  }

  if (intent === "activate") {
    await prisma.staffUser.update({ where: { id }, data: { active: true } });
    await audit(me, "staff.activate", target.name, { href: "/admin/staff" });
    revalidatePath("/admin/staff");
    return { ok: `${target.name} can log in again.` };
  }

  if (intent === "reset") {
    if (self) return { error: "Change your own password on the Your account page." };
    const password = temporaryPassword();
    await prisma.staffUser.update({
      where: { id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true, sessionVersion: { increment: 1 } },
    });
    await audit(me, "staff.reset", target.name, { href: "/admin/staff" });
    revalidatePath("/admin/staff");
    return { credentials: { name: target.name, email: target.email, password } };
  }

  return { error: "Unknown action." };
}
