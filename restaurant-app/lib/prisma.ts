import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

/**
 * Database URL resolution:
 *
 * Production (Vercel + Turso):
 *   Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.
 *   e.g. TURSO_DATABASE_URL=libsql://your-db.turso.io
 *
 * Development (local SQLite):
 *   Falls back to a local file: prisma/dev.db
 *   Or set DATABASE_URL=file:/absolute/path/to/db.sqlite
 */
function getDbConfig(): { url: string; authToken?: string } {
  // Turso / remote libsql (production)
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url:       process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }
  }
  // Explicit DATABASE_URL override
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL }
  }
  // Local SQLite fallback (development)
  const localPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  return { url: `file:${localPath}` }
}

function createPrismaClient() {
  const config = getDbConfig()
  const adapter = new PrismaLibSql(config)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
