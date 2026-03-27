import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Context = { params?: Record<string, string | string[]> }

/** GET /api/suppliers/[id] */
export const GET = auth(async function GET(
  req: NextRequest & { auth: Session | null },
  ctx: Context
) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: ctx.params?.['id'] as string } })
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ supplier })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** PUT /api/suppliers/[id] — update (COMPRAS or ADMIN only) */
export const PUT = auth(async function PUT(
  req: NextRequest & { auth: Session | null },
  ctx: Context
) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, nit, email, phone } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    if (nit) {
      const existing = await prisma.supplier.findFirst({
        where: { nit, NOT: { id: ctx.params?.['id'] as string } },
      })
      if (existing) return NextResponse.json({ error: `El NIT ${nit} ya está en uso` }, { status: 409 })
    }

    const supplier = await prisma.supplier.update({
      where: { id: ctx.params?.['id'] as string },
      data: { name: name.trim(), nit: nit || null, email: email || null, phone: phone || null },
    })

    return NextResponse.json({ supplier })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
})
