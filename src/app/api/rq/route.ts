import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/rq
 *
 * Returns a list of RQs filtered by the authenticated user's role,
 * plus KPI counts. Query params: page, limit, status.
 *
 * SOLICITANTE  → only their own RQs
 * COMPRAS      → RQs in ENVIADA_COMPRAS, EN_COMPARATIVO, OC_EMITIDA
 * AUTORIZADOR  → RQs in EN_AUTORIZACION
 * ADMIN        → all RQs
 *
 * Uses auth() as a handler wrapper (NextAuth v5 Route Handler pattern)
 * so the session is always available via req.auth.
 */
export const GET = auth(async function GET(
  req: NextRequest & { auth: Session | null }
) {
  try {
    const session = req.auth

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '15'))
    const statusFilter = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const role = user.role

    // Build where clause based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (role === 'SOLICITANTE') {
      where.requesterId = user.id
    } else if (role === 'COMPRAS') {
      where.status = { in: ['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'APROBADA', 'OC_EMITIDA'] }
    } else if (role === 'AUTORIZADOR') {
      where.status = 'EN_AUTORIZACION'
    }
    // ADMIN sees everything

    if (statusFilter) {
      where.status = statusFilter
    }

    const [rqs, total] = await Promise.all([
      prisma.rQ.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          createdAt: true,
          project: { select: { name: true } },
          requester: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.rQ.count({ where }),
    ])

    // KPI counts (global for the role scope, ignoring pagination)
    const kpiWhere = role === 'SOLICITANTE' ? { requesterId: user.id } : {}
    const [kpiTotal, kpiClosed, kpiApproved] = await Promise.all([
      prisma.rQ.count({ where: kpiWhere }),
      prisma.rQ.count({ where: { ...kpiWhere, status: 'CERRADA' } }),
      prisma.rQ.count({ where: { ...kpiWhere, status: 'APROBADA' } }),
    ])

    const formatted = rqs.map((rq) => ({
      id: rq.id,
      code: rq.code,
      title: rq.title,
      status: rq.status,
      createdAt: rq.createdAt,
      project: rq.project.name,
      requester: rq.requester.name || rq.requester.email,
      itemCount: rq._count.items,
    }))

    return NextResponse.json({
      rqs: formatted,
      total,
      page,
      limit,
      kpis: {
        total: kpiTotal,
        inProcess: Math.max(0, kpiTotal - kpiClosed - kpiApproved),
        approved: kpiApproved,
        closed: kpiClosed,
      },
    })
  } catch (error) {
    console.error('GET /api/rq error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
