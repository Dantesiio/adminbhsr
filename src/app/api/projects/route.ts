import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ projects })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { code, name, client } = await req.json()
    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'Código y nombre son obligatorios' }, { status: 400 })
    }
    const existing = await prisma.project.findUnique({ where: { code: code.trim() } })
    if (existing) return NextResponse.json({ error: `El código ${code} ya existe` }, { status: 409 })

    const project = await prisma.project.create({
      data: { code: code.trim(), name: name.trim(), client: client || null },
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear el proyecto' }, { status: 500 })
  }
})
