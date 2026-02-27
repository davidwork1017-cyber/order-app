import path from "path";
import { defineConfig } from "prisma/config";

/**
 * Prisma config for migrations (CLI use only).
 * For production, set TURSO_DATABASE_URL in your environment.
 */
const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  `file:${path.resolve(process.cwd(), "prisma", "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url },
});
