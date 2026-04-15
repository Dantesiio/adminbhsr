import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/** GET /api/rq/[id]/quotes — load RQ with items, quotes (with QuoteItems) + supplier catalog */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const [rq, suppliers] = await Promise.all([
      prisma.rQ.findUnique({
        where: { id: rqId },
        include: {
          items: { orderBy: { id: 'asc' } },
          project: { select: { name: true } },
          quotes: {
            include: {
              supplier: { select: { id: true, name: true } },
              items: true,   // QuoteItems per supplier
            },
            orderBy: { createdAt: 'asc' },
          },
          comparison: true,
        },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, nit: true, email: true, phone: true },
      }),
    ])

    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    return NextResponse.json({ rq, suppliers })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/rq/[id]/quotes — add a quote with per-item pricing */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rqId = ctx.params?.['id'] as string
  try {
    const {
      supplierId,
      currency = 'COP',
      validez,
      leadTime,
      notes,
      items = [],   // QuoteItem rows: { rqItemId, uom, qty, price, specNote }
    } = await req.json()

    if (!supplierId) {
      return NextResponse.json({ error: 'El proveedor es obligatorio' }, { status: 400 })
    }

    // Calculate total from items; fallback to 0 if no items
    const computedTotal = (items as Array<{ qty?: number; price?: number }>).reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0
    )
    if (computedTotal <= 0) {
      return NextResponse.json({ error: 'Ingresa al menos un precio para calcular el total' }, { status: 400 })
    }

    const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    if (!['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(rq.status)) {
      return NextResponse.json({ error: 'La RQ no está en estado válido para agregar cotizaciones' }, { status: 409 })
    }

    const existing = await prisma.quote.findFirst({ where: { rqId, supplierId } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cotización de este proveedor para esta RQ' }, { status: 409 })
    }

    // Create Quote + QuoteItems in a transaction
    const quote = await prisma.$transaction(async tx => {
      const q = await tx.quote.create({
        data: {
          rqId,
          supplierId,
          total: computedTotal,
          currency,
          validez: validez ? new Date(validez) : null,
          leadTime: leadTime || null,
          notes: notes || null,
        },
        include: { supplier: { select: { id: true, name: true } } },
      })

      if (items.length > 0) {
        await tx.quoteItem.createMany({
          data: (items as Array<{ rqItemId?: string; uom?: string; qty?: number; price?: number; specNote?: string }>)
            .filter(item => (Number(item.qty) || 0) > 0 || (Number(item.price) || 0) > 0)
            .map(item => ({
              quoteId: q.id,
              rqItemId: item.rqItemId || null,
              qty: Number(item.qty) || 0,
              price: Number(item.price) || 0,
              uom: item.uom || null,
              specNote: item.specNote || null,
            })),
        })
      }

      // Advance to EN_COMPARATIVO on first quote
      if (rq.status === 'ENVIADA_COMPRAS') {
        await tx.rQ.update({ where: { id: rqId }, data: { status: 'EN_COMPARATIVO' } })
      }

      return q
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar cotización' }, { status: 500 })
  }
})
