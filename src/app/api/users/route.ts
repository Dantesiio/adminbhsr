import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

const VALID_ROLES: string[] = Object.values(Role)

function adminOnly(session: Session | null) {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/** GET /api/users — list all users (ADMIN only) */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }) {
  const guard = adminOnly(req.auth)
  if (guard) return guard
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/users — create user (ADMIN only) */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }) {
  const guard = adminOnly(req.auth)
  if (guard) return guard

  try {
    const { name, email, password, role } = await req.json()

    if (!email?.trim()) return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    if (!password || password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
    if (existing) return NextResponse.json({ error: `Ya existe un usuario con el email ${email}` }, { status: 409 })

    const passwordHash = await hash(password, 12)
    const user = await prisma.user.create({
      data: { name: name?.trim() || null, email: email.trim(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }
})
