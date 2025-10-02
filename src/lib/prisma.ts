import { PrismaClient } from '@prisma/client'

// Create a singleton instance of PrismaClient.  During development
// Next.js will hot-reload modules, so we attach the instance to the
// global scope.  In production there will only ever be one instance.
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  })

// Only cache the instance on the global object in non‑production
// environments.  In production, the module will be executed once.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma