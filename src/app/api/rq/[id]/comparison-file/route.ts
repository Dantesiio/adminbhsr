import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

/** POST /api/rq/[id]/comparison-file — upload Excel comparison file to Vercel Blob */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rqId = ctx.params?.['id'] as string

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ error: 'Solo se permiten archivos Excel (.xlsx, .xls) o CSV' }, { status: 400 })
    }

    const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { id: true, code: true } })
    if (!rq) return NextResponse.json({ error: 'RQ no encontrada' }, { status: 404 })

    const ext = file.name.split('.').pop() || 'xlsx'
    const filename = `comparativo-${rq.code}-${Date.now()}.${ext}`

    const blob = await put(`rq-comparativos/${filename}`, file, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    })

    // Store URL in comparison.checklist JSON field
    const existing = await prisma.comparison.findUnique({ where: { rqId } })
    if (existing) {
      const checklist = (existing.checklist as Record<string, unknown> | null) ?? {}
      await prisma.comparison.update({
        where: { rqId },
        data: { checklist: { ...checklist, comparisonFileUrl: blob.url } },
      })
    } else {
      await prisma.comparison.create({
        data: {
          rqId,
          checklist: { comparisonFileUrl: blob.url },
        },
      })
    }

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[comparison-file]', err)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
})
