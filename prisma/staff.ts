/**
 * Staff account commands for the server, for when nobody can log in to fix it
 * in Admin » Staff (e.g. the only owner forgot their password).
 *
 *   npm run staff -- list
 *   npm run staff -- reset someone@example.com    prints a temporary password
 *
 * On the live server use deploy/staff.sh, which runs this inside the container.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { config } from "dotenv";

import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword, temporaryPassword } from "../lib/passwords";

config({ path: [".env.local", ".env"], quiet: true });
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }) });

async function main() {
  const [cmd, email] = process.argv.slice(2);

  if (cmd === "list") {
    const staff = await prisma.staffUser.findMany({ orderBy: { createdAt: "asc" } });
    if (!staff.length) console.log("No staff accounts yet. Open /admin to create the owner account.");
    for (const s of staff) console.log(`${s.active ? "active  " : "off     "}${s.role.padEnd(11)}${s.email}  (${s.name})`);
    return;
  }

  if (cmd === "reset" && email) {
    const staff = await prisma.staffUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!staff) {
      console.error(`No account for ${email}. Run "list" to see them.`);
      process.exitCode = 1;
      return;
    }
    const password = temporaryPassword();
    await prisma.staffUser.update({
      where: { id: staff.id },
      // Also switches the account back on, and ends every existing session
      data: { passwordHash: await hashPassword(password), mustChangePassword: true, active: true, sessionVersion: { increment: 1 } },
    });
    await prisma.auditLog.create({ data: { staffName: "Server command", action: "staff.reset", target: staff.name, href: "/admin/staff" } });
    console.log(`Temporary password for ${staff.email}: ${password}`);
    console.log("They'll be asked to choose a new one when they log in.");
    return;
  }

  console.log("Usage:\n  npm run staff -- list\n  npm run staff -- reset someone@example.com");
  process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
