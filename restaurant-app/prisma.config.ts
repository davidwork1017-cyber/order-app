import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: `file:${path.resolve(process.cwd(), "prisma", "dev.db")}`,
  },
});
