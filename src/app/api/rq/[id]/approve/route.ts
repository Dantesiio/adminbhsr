import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/** GET /api/rq/[id]/approve — load RQ data for approval page */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
      include: {
        project: { select: { name: true } },
        requester: { select: { name: true, email: true } },
        quotes: { include: { supplier: { select: { id: true, name: true } } } },
        comparison: { include: { chosen: { select: { id: true, name: true } } } },
        approvals: { include: { approver: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    return NextResponse.json({ rq })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/rq/[id]/approve — approve or reject RQ */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['AUTORIZADOR', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const approverId = (session.user as { id?: string }).id
  if (!approverId) return NextResponse.json({ error: 'User id missing' }, { status: 400 })

  const rqId = ctx.params?.['id'] as string
  try {
    const { decision, comment } = await req.json()
    if (!decision || !comment?.trim()) {
      return NextResponse.json({ error: 'Decisión y comentario son obligatorios' }, { status: 400 })
    }
    if (!['APROBADA', 'RECHAZADA'].includes(decision)) {
      return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 })
    }

    const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    if (rq.status !== 'EN_AUTORIZACION') {
      return NextResponse.json({ error: 'La RQ debe estar en estado EN_AUTORIZACION' }, { status: 409 })
    }

    const approvalStatus = decision === 'APROBADA' ? 'APROBADO' : 'RECHAZADO'
    // Rejected → RECHAZADA so requester can revise and resubmit
    const nextRQStatus = decision === 'APROBADA' ? 'APROBADA' : 'RECHAZADA'

    const [approval] = await prisma.$transaction([
      prisma.approval.create({
        data: { rqId, approverId, status: approvalStatus, comment },
      }),
      prisma.rQ.update({ where: { id: rqId }, data: { status: nextRQStatus } }),
    ])

    return NextResponse.json({ approval, newStatus: nextRQStatus })
  } catch {
    return NextResponse.json({ error: 'Error al procesar la decisión' }, { status: 500 })
  }
})
