import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const costCenter = await prisma.costCenter.findUnique({ where: { id: ctx.params?.['id'] as string } })
    if (!costCenter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ costCenter })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

export const PUT = auth(async function PUT(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const id = ctx.params?.['id'] as string
    const { code, name, active } = await req.json()
    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'Código y nombre son obligatorios' }, { status: 400 })
    }
    const existing = await prisma.costCenter.findFirst({ where: { code: code.trim(), NOT: { id } } })
    if (existing) return NextResponse.json({ error: `El código ${code} ya está en uso` }, { status: 409 })

    const costCenter = await prisma.costCenter.update({
      where: { id },
      data: { code: code.trim(), name: name.trim(), active: Boolean(active) },
    })
    return NextResponse.json({ costCenter })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
})
