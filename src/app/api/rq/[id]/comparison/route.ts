import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/**
 * POST /api/rq/[id]/comparison
 * Select the winning supplier → create/update Comparison → advance RQ to EN_AUTORIZACION
 */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rqId = ctx.params?.['id'] as string
  try {
    const { chosenSupplierId } = await req.json()
    if (!chosenSupplierId) return NextResponse.json({ error: 'Debe seleccionar un proveedor ganador' }, { status: 400 })

    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
      include: { quotes: true },
    })
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    if (rq.status !== 'EN_COMPARATIVO') {
      return NextResponse.json({ error: 'La RQ debe estar en estado EN_COMPARATIVO' }, { status: 409 })
    }
    if (rq.quotes.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 cotizaciones para crear un comparativo' }, { status: 409 })
    }

    // Verify chosen supplier has a quote on this RQ
    const chosenQuote = rq.quotes.find(q => q.supplierId === chosenSupplierId)
    if (!chosenQuote) return NextResponse.json({ error: 'El proveedor seleccionado no tiene cotización en esta RQ' }, { status: 400 })

    // Upsert comparison + advance status in a transaction
    const [comparison] = await prisma.$transaction([
      prisma.comparison.upsert({
        where: { rqId },
        create: { rqId, chosenId: chosenSupplierId, publishedAt: new Date() },
        update: { chosenId: chosenSupplierId, publishedAt: new Date() },
      }),
      prisma.rQ.update({ where: { id: rqId }, data: { status: 'EN_AUTORIZACION' } }),
    ])

    return NextResponse.json({ comparison })
  } catch {
    return NextResponse.json({ error: 'Error al crear comparativo' }, { status: 500 })
  }
})
