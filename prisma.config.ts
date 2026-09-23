import { config } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 requires this file: the datasource URL no longer lives in
 * schema.prisma and the CLI no longer auto-loads env files. Load .env.local
 * first so it wins, matching Next's precedence.
 */
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Falls back to a local SQLite file so a fresh clone works with no .env
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
