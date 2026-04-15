import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

/** GET /api/suppliers — list all suppliers */
export const GET = auth(async function GET(
  req: NextRequest & { auth: Session | null }
) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/suppliers — create supplier (COMPRAS or ADMIN only) */
export const POST = auth(async function POST(
  req: NextRequest & { auth: Session | null }
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

    // Check NIT uniqueness manually for a clear error message
    if (nit) {
      const existing = await prisma.supplier.findUnique({ where: { nit } })
      if (existing) return NextResponse.json({ error: `El NIT ${nit} ya está registrado` }, { status: 409 })
    }

    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), nit: nit || null, email: email || null, phone: phone || null },
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear el proveedor' }, { status: 500 })
  }
})
