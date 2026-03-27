import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: params.id },
      select: {
        code: true,
        title: true,
        status: true,
        receipts: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, notes: true, createdAt: true },
        },
      },
    })
    if (!rq) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ rq: { code: rq.code, title: rq.title, status: rq.status }, receipts: rq.receipts })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ rq: null, receipts: [] })
  }
}
