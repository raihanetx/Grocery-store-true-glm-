import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimized Prisma client - no logging for production speed
// Schema updated: storeTagline -> storeFavicon
export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
