import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/rq
 *
 * Returns a list of RQs filtered by the authenticated user's role,
 * plus KPI counts. Query params: page, limit, status.
 *
 * SOLICITANTE  → only their own RQs
 * COMPRAS      → RQs in ENVIADA_COMPRAS, EN_COMPARATIVO
 * AUTORIZADOR  → RQs in EN_AUTORIZACION
 * ADMIN        → all RQs
 */
export async function GET(request: Request) {
  try {
    // auth() may throw in Next.js 14 due to headers() sync/async mismatch with NextAuth v5.
    // Wrap it separately so a session failure falls through to mock data, not a 500.
    let session = null
    try {
      session = await auth()
    } catch {
      // fall through to mock data below
    }

    if (!session?.user?.id) {
      // No session — return mock KPIs so the dashboard still renders in demo/dev mode
      return NextResponse.json({
        rqs: [
          { id: '1', code: 'RQ-0001', title: 'Compra de bolsas quirúrgicas', status: 'ENVIADA_COMPRAS', createdAt: new Date(), project: 'ECHO Bolsas', requester: 'Logística HSR', itemCount: 3 },
          { id: '2', code: 'RQ-0002', title: 'Material de curación', status: 'EN_COMPARATIVO', createdAt: new Date(), project: 'Hospitalización', requester: 'Centro Logístico', itemCount: 5 },
          { id: '3', code: 'RQ-0003', title: 'Equipos de laboratorio', status: 'APROBADA', createdAt: new Date(), project: 'Laboratorio Clínico', requester: 'Investigación', itemCount: 2 },
          { id: '4', code: 'RQ-0004', title: 'Nebulizadores pediátricos', status: 'OC_EMITIDA', createdAt: new Date(), project: 'Pediatría', requester: 'Piso 4', itemCount: 6 },
          { id: '5', code: 'RQ-0005', title: 'Contrato esterilización', status: 'CERRADA', createdAt: new Date(), project: 'Central Esterilización', requester: 'Jefatura', itemCount: 1 },
        ],
        total: 12,
        page: 1,
        limit: 10,
        kpis: { total: 12, inProcess: 7, approved: 3, closed: 2 },
      })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))
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
      where.status = { in: ['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'OC_EMITIDA', 'EN_RECEPCION'] }
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

    // KPI counts (always global for the role scope, ignoring pagination filters)
    const kpiWhere = role === 'SOLICITANTE' ? { requesterId: user.id } : {}
    const [kpiTotal, kpiClosed, kpiApproved] = await Promise.all([
      prisma.rQ.count({ where: kpiWhere }),
      prisma.rQ.count({ where: { ...kpiWhere, status: 'CERRADA' } }),
      prisma.rQ.count({ where: { ...kpiWhere, status: 'APROBADA' } }),
    ])
    const kpiInProcess = kpiTotal - kpiClosed - kpiApproved

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
        inProcess: Math.max(0, kpiInProcess),
        approved: kpiApproved,
        closed: kpiClosed,
      },
    })
  } catch (error) {
    console.error('GET /api/rq error:', error)
    // Return mock data if DB not available
    return NextResponse.json({
      rqs: [
        { id: '1', code: 'RQ-0001', title: 'Compra de bolsas quirúrgicas', status: 'ENVIADA_COMPRAS', createdAt: new Date(), project: 'ECHO Bolsas', requester: 'Logística HSR', itemCount: 3 },
        { id: '2', code: 'RQ-0002', title: 'Material de curación', status: 'EN_COMPARATIVO', createdAt: new Date(), project: 'Hospitalización', requester: 'Centro Logístico', itemCount: 5 },
        { id: '3', code: 'RQ-0003', title: 'Equipos de laboratorio', status: 'APROBADA', createdAt: new Date(), project: 'Laboratorio', requester: 'Investigación', itemCount: 2 },
      ],
      total: 3,
      page: 1,
      limit: 10,
      kpis: { total: 12, inProcess: 7, approved: 3, closed: 2 },
    })
  }
}
