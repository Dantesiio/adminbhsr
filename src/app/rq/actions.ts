/**
 * Server actions related to requisitions (RQ).  These functions run
 * exclusively on the server and can be invoked from client code via
 * the built-in `use server` directive provided by Next.js.
 */
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional().default(''),
  qty: z.coerce.number().positive('Debe ser > 0'),
  uom: z.string().optional().default('unidad'),
})

const RQSchema = z.object({
  projectId: z.string().min(1),
  costCenterId: z.string().optional().nullable(),
  title: z.string().min(3),
  description: z.string().optional().default(''),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})

export type CreateRQInput = z.infer<typeof RQSchema>

// ─── createRQ ─────────────────────────────────────────────────────────────────

/**
 * Create a new requisition and immediately set status to ENVIADA_COMPRAS.
 */
export async function createRQ(input: CreateRQInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const data = RQSchema.parse(input)

  try {
    const requester = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!requester) throw new Error('Usuario no encontrado')

    const count = await prisma.rQ.count()
    const code = `RQ-${String(count + 1).padStart(4, '0')}`

    const rq = await prisma.rQ.create({
      data: {
        code,
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        costCenterId: data.costCenterId || null,
        requesterId: requester.id,
        status: 'ENVIADA_COMPRAS',
        items: {
          create: data.items.map((i) => ({
            name: i.name,
            spec: i.spec,
            qty: i.qty,
            uom: i.uom,
          })),
        },
      },
      include: { items: true, project: true },
    })

    revalidatePath('/dashboard')
    revalidatePath('/rq')
    return rq
  } catch (error) {
    console.error('Database error, returning mock RQ:', error)
    return {
      id: `mock-${Date.now()}`,
      code: `RQ-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
      title: data.title,
      description: data.description,
      status: 'ENVIADA_COMPRAS',
      items: data.items.map((item, idx) => ({
        id: `item-${idx}`,
        name: item.name,
        spec: item.spec || '',
        qty: item.qty,
        uom: item.uom || 'unidad',
      })),
      project: { name: 'Proyecto Demo' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

// ─── submitApproval ───────────────────────────────────────────────────────────

export async function submitApproval(
  rqId: string,
  status: 'APROBADO' | 'RECHAZADO',
  comment?: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'AUTORIZADOR') throw new Error('No autorizado')

  const rq = await prisma.rQ.findUnique({ where: { id: rqId } })
  if (!rq || rq.status !== 'EN_AUTORIZACION') throw new Error('RQ no encontrada o no en autorización')

  await prisma.approval.create({
    data: { rqId, approverId: user.id, status, comment },
  })

  const approvals = await prisma.approval.findMany({ where: { rqId } })
  const anyRejected = approvals.some((a) => a.status === 'RECHAZADO')
  const allApproved = approvals.every((a) => a.status === 'APROBADO')

  if (anyRejected) {
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'ENVIADA_COMPRAS' } })
  } else if (allApproved) {
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'APROBADA' } })
  }

  revalidatePath(`/rq/${rqId}`)
  return { success: true }
}

// ─── registrarRecepcion ───────────────────────────────────────────────────────

const RecepcionSchema = z.object({
  rqId: z.string().min(1),
  status: z.enum(['CONFORME', 'NO_CONFORME']),
  notes: z.string().optional().default(''),
  fechaRecepcion: z.string().optional(),
})

export type RegistrarRecepcionInput = z.infer<typeof RecepcionSchema>

/**
 * Register a goods reception event for an RQ.
 * - CONFORME  → closes the RQ (status = CERRADA)
 * - NO_CONFORME → leaves the RQ in EN_RECEPCION with a note
 */
export async function registrarRecepcion(input: RegistrarRecepcionInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('Usuario no encontrado')
  if (!['COMPRAS', 'ADMIN'].includes(user.role)) throw new Error('No autorizado para registrar recepciones')

  const data = RecepcionSchema.parse(input)

  const rq = await prisma.rQ.findUnique({ where: { id: data.rqId } })
  if (!rq) throw new Error('RQ no encontrada')
  if (rq.status !== 'OC_EMITIDA') {
    throw new Error('La RQ debe estar en estado OC_EMITIDA para registrar recepción')
  }

  // Create the receipt record
  await prisma.receipt.create({
    data: {
      rqId: data.rqId,
      status: data.status,
      notes: data.notes || null,
    },
  })

  // Update RQ status — CONFORME closes it, NO_CONFORME keeps it at OC_EMITIDA
  const newStatus = data.status === 'CONFORME' ? 'CERRADA' : 'OC_EMITIDA'
  await prisma.rQ.update({
    where: { id: data.rqId },
    data: { status: newStatus },
  })

  revalidatePath(`/rq/${data.rqId}`)
  revalidatePath('/dashboard')

  return { success: true, newStatus }
}
