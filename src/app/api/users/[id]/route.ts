import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

const VALID_ROLES: string[] = Object.values(Role)

function adminOnly(session: Session | null) {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/** GET /api/users/[id] */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const guard = adminOnly(req.auth)
  if (guard) return guard
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.params?.['id'] as string },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** PUT /api/users/[id] — update name, email, role, optionally password */
export const PUT = auth(async function PUT(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const guard = adminOnly(req.auth)
  if (guard) return guard

  try {
    const id = ctx.params?.['id'] as string
    const { name, email, role, password } = await req.json()

    if (!email?.trim()) return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

    // Check email uniqueness excluding this user
    const existing = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id } } })
    if (existing) return NextResponse.json({ error: `El email ${email} ya está en uso` }, { status: 409 })

    const data: Record<string, unknown> = { name: name?.trim() || null, email: email.trim(), role }
    if (password) {
      if (password.length < 8) return NextResponse.json({ error: 'Mínimo 8 caracteres' }, { status: 400 })
      data.passwordHash = await hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
})
