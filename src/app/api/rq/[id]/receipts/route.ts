import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
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
})
