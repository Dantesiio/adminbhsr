import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/** GET /api/rq/[id]/quotes — load RQ with existing quotes + supplier catalog */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const [rq, suppliers] = await Promise.all([
      prisma.rQ.findUnique({
        where: { id: rqId },
        include: {
          items: true,
          project: { select: { name: true } },
          quotes: {
            include: { supplier: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          comparison: true,
        },
      }),
      prisma.supplier.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, nit: true, email: true, phone: true } }),
    ])

    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    return NextResponse.json({ rq, suppliers })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/rq/[id]/quotes — add a quote */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rqId = ctx.params?.['id'] as string
  try {
    const { supplierId, total, currency = 'COP', validez, leadTime, notes } = await req.json()

    if (!supplierId || !total) {
      return NextResponse.json({ error: 'Proveedor y total son obligatorios' }, { status: 400 })
    }

    const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    if (!['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(rq.status)) {
      return NextResponse.json({ error: 'La RQ no está en estado válido para agregar cotizaciones' }, { status: 409 })
    }

    // Check duplicate supplier for this RQ
    const existing = await prisma.quote.findFirst({ where: { rqId, supplierId } })
    if (existing) return NextResponse.json({ error: 'Ya existe una cotización de este proveedor para esta RQ' }, { status: 409 })

    const quote = await prisma.quote.create({
      data: {
        rqId,
        supplierId,
        total,
        currency,
        validez: validez ? new Date(validez) : null,
        leadTime: leadTime || null,
        notes: notes || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    })

    // Advance status to EN_COMPARATIVO when first quote is added
    if (rq.status === 'ENVIADA_COMPRAS') {
      await prisma.rQ.update({ where: { id: rqId }, data: { status: 'EN_COMPARATIVO' } })
    }

    return NextResponse.json({ quote }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar cotización' }, { status: 500 })
  }
})
