import "server-only";

import { prisma } from "./prisma";

/** Records who did what in /admin. Never throws: a failed log entry shouldn't undo the change. */
export async function audit(
  staff: { id: string; name: string } | null,
  action: string,
  target: string,
  opts: { href?: string; detail?: string } = {}
) {
  try {
    await prisma.auditLog.create({
      data: { staffId: staff?.id ?? null, staffName: staff?.name ?? "System", action, target, href: opts.href ?? null, detail: opts.detail ?? null },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}
