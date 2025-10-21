import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_ENV_LOGGED__: boolean | undefined
}

// Create a singleton instance of PrismaClient.  During development
// Next.js will hot-reload modules, so we attach the instance to the
// global scope.  In production there will only ever be one instance.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Lightweight debug to verify the effective datasource and engine being used at runtime
// Helps diagnose accidental use of Prisma Accelerate/Data Proxy in local dev
function logPrismaEnvOnce() {
  if (process.env.NODE_ENV === 'production') return
  if (globalThis.__PRISMA_ENV_LOGGED__) return
  globalThis.__PRISMA_ENV_LOGGED__ = true
  const raw = process.env.DATABASE_URL || ''
  let masked: string
  try {
    const u = new URL(raw)
    if (u.password) {
      u.password = '****'
    }
    if (u.username) {
      u.username = '****'
    }
    masked = u.toString()
  } catch {
    // not a valid URL (or empty) – keep as-is but avoid printing secrets
    masked = raw.replace(/:\/\/.*?:.*?@/, '://****:****@')
  }
  const engine = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library'
  const hint = raw.startsWith('prisma://') || raw.startsWith('prisma+postgres://') ? ' (DATA PROXY URL DETECTED)' : ''
  // eslint-disable-next-line no-console
  console.warn(`[prisma] engine=${engine} url=${masked}${hint}`)
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  })

logPrismaEnvOnce()

// Only cache the instance on the global object in non‑production
// environments.  In production, the module will be executed once.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma