import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReciboPDF } from '@/components/ReciboPDF'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
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
      include: {
        items: true,
        project: true,
        costCenter: true,
        requester: true,
        receipts: { orderBy: { createdAt: 'desc' }, take: 1 },
        po: { include: { supplier: true } },
        comparison: { include: { chosen: true } },
      },
    })

    if (!rq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const element = createElement(ReciboPDF, { rq }) as unknown as ReactElement<DocumentProps>
    const pdfBuffer = await renderToBuffer(element)

    const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-${rq.code}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 })
  }
})
