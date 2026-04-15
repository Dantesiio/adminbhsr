import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { OCPDF } from '@/components/OCPDF'
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
        po: { include: { supplier: true } },
      },
    })

    if (!rq) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!rq.po) return NextResponse.json({ error: 'Esta RQ no tiene Orden de Compra emitida' }, { status: 404 })

    // Read logo as base64
    let logoBase64: string | undefined
    try {
      const logoPath = path.join(process.cwd(), 'src', 'lib', 'images', 'logo.svg.jpeg')
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
    } catch { /* logo not available */ }

    const po = rq.po

    const poData = {
      number: po.number,
      createdAt: po.createdAt,
      total: Number(po.total),
      condicionEntrega: po.condicionEntrega ?? null,
      condicionPago: po.condicionPago ?? null,
      notasImportantes: po.notasImportantes ?? null,
      rq: {
        consecutivo: rq.consecutivo ?? null,
        financiador: rq.financiador ?? null,
        title: rq.title,
        items: rq.items.map((item) => ({
          spec: item.spec ?? null,
          name: item.name,
          uom: item.uom ?? null,
          qty: Number(item.qty),
          precioEstimado: item.precioEstimado != null ? Number(item.precioEstimado) : null,
        })),
      },
      supplier: {
        name: po.supplier.name,
        nit: po.supplier.nit ?? null,
        email: po.supplier.email ?? null,
        phone: po.supplier.phone ?? null,
      },
    }

    const element = createElement(OCPDF, {
      po: poData,
      logoBase64,
      euroRate: 4219.38,
      usdRate: 3674.14,
    }) as unknown as ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(element)

    const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OC-${po.number}-${rq.code}.pdf"`,
      },
    })
  } catch (err) {
    console.error('OC PDF generation error:', err)
    return NextResponse.json({ error: 'Error al generar el PDF de la OC' }, { status: 500 })
  }
})
