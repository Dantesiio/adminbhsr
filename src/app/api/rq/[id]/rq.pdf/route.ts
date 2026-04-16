import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { RQPDF } from '@/components/RQPDF'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const rq = await prisma.rQ.findUnique({
      where: { id: rqId },
      include: {
        items: { orderBy: { name: 'asc' } },
        project: true,
        requester: true,
      },
    })

    if (!rq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Read logo as base64
    let logoBase64: string | undefined
    try {
      const logoPath = path.join(process.cwd(), 'src', 'lib', 'images', 'logobhsr.png')
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
    } catch { /* logo not available */ }

    const rqData = {
      ...rq,
      items: rq.items.map(item => ({
        ...item,
        qty: Number(item.qty),
        precioEstimado: item.precioEstimado ? Number(item.precioEstimado) : null,
      })),
    }

    const euroRate = rq.euroRate ? Number(rq.euroRate) : undefined
    const usdRate = rq.usdRate ? Number(rq.usdRate) : undefined
    const ivaRate = rq.ivaRate ? Number(rq.ivaRate) : 0
    const element = createElement(RQPDF, { rq: rqData, logoBase64, euroRate, usdRate, ivaRate }) as unknown as ReactElement<DocumentProps>
    const pdfBuffer = await renderToBuffer(element)

    const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="RQ-${rq.code}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 })
  }
})
