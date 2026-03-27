import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Route-based role restrictions.
 * Routes not listed here only require authentication (any role is valid).
 */
const ROLE_RULES: Array<{ pattern: RegExp; allowed: string[] }> = [
  // Only requesters and admins can create a new RQ
  { pattern: /^\/rq\/new$/, allowed: ['SOLICITANTE', 'ADMIN'] },
  // Quotes workflow: purchasing team
  { pattern: /^\/rq\/[^/]+\/quotes/, allowed: ['COMPRAS', 'ADMIN'] },
  // Approval workflow: authorizer
  { pattern: /^\/rq\/[^/]+\/approve/, allowed: ['AUTORIZADOR', 'ADMIN'] },
  // Reception workflow: purchasing team
  { pattern: /^\/rq\/[^/]+\/recepcion/, allowed: ['COMPRAS', 'ADMIN'] },
  // Supplier catalog: purchasing team
  { pattern: /^\/suppliers/, allowed: ['COMPRAS', 'ADMIN'] },
  // Financial catalogs and user management: admin only
  { pattern: /^\/projects/, allowed: ['ADMIN'] },
  { pattern: /^\/cost-centers/, allowed: ['ADMIN'] },
  { pattern: /^\/users/, allowed: ['ADMIN'] },
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Always allow auth endpoints and static assets (redundant with matcher but safe)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const isApiRoute = pathname.startsWith('/api/')

  // ── Require authentication ──────────────────────────────────────────────────
  if (!req.auth?.user) {
    if (isApiRoute) {
      // API routes return JSON 401 instead of redirecting
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  const role = (req.auth.user as { role?: string }).role ?? ''

  // ── Enforce role-based access ───────────────────────────────────────────────
  for (const { pattern, allowed } of ROLE_RULES) {
    if (pattern.test(pathname)) {
      if (!allowed.includes(role)) {
        if (isApiRoute) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico   (favicon)
     * - public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
