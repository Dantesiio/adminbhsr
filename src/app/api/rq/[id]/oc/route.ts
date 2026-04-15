import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/** GET /api/rq/[id]/oc — data needed to emit OC */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
      include: {
        project: { select: { name: true } },
        quotes: { include: { supplier: { select: { id: true, name: true } } } },
        comparison: { include: { chosen: { select: { id: true, name: true } } } },
      },
    })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })

    // Suggest next OC number
    const poCount = await prisma.pO.count()
    const year = new Date().getFullYear()
    const suggestedNumber = `OC-${year}-${String(poCount + 1).padStart(4, '0')}`

    return NextResponse.json({ rq, suggestedNumber })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/rq/[id]/oc — emit PO and advance RQ to OC_EMITIDA */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rqId = ctx.params?.['id'] as string
  try {
    const { ocNumber } = await req.json()
    if (!ocNumber?.trim()) {
      return NextResponse.json({ error: 'El número de OC es obligatorio' }, { status: 400 })
    }

    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
      include: {
        comparison: true,
        quotes: true,
      },
    })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    if (rq.status !== 'APROBADA') {
      return NextResponse.json({ error: 'La RQ debe estar en estado APROBADA' }, { status: 409 })
    }
    if (!rq.comparison?.chosenId) {
      return NextResponse.json({ error: 'No hay proveedor ganador seleccionado en el comparativo' }, { status: 409 })
    }

    const chosenQuote = rq.quotes.find(q => q.supplierId === rq.comparison!.chosenId)
    if (!chosenQuote) {
      return NextResponse.json({ error: 'No se encontró la cotización del proveedor ganador' }, { status: 409 })
    }

    // Check OC number uniqueness
    const existing = await prisma.pO.findUnique({ where: { number: ocNumber } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una OC con ese número' }, { status: 409 })
    }

    const [po] = await prisma.$transaction([
      prisma.pO.create({
        data: {
          number: ocNumber,
          rqId,
          supplierId: rq.comparison.chosenId,
          currency: chosenQuote.currency,
          total: chosenQuote.total,
        },
      }),
      prisma.rQ.update({ where: { id: rqId }, data: { status: 'OC_EMITIDA' } }),
    ])

    return NextResponse.json({ po }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una OC con ese número' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al emitir OC' }, { status: 500 })
  }
})
