import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReciboPDF } from '@/components/ReciboPDF'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: params.id },
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

    // @react-pdf/renderer requires a ReactElement<DocumentProps> — cast safely
    const element = createElement(ReciboPDF, { rq }) as unknown as ReactElement<DocumentProps>
    const pdfBuffer = await renderToBuffer(element)

    // NextResponse expects a Blob/ReadableStream/ArrayBuffer — convert Buffer
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
}
