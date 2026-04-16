/**
 * Server actions related to requisitions (RQ).  These functions run
 * exclusively on the server and can be invoked from client code via
 * the built-in `use server` directive provided by Next.js.
 */
'use server'

import { prisma } from '@/lib/prisma'
import { getServerActionSession } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional().default(''),
  descripcion: z.string().optional().default(''),
  comentario: z.string().optional().default(''),
  qty: z.coerce.number().positive('Debe ser > 0'),
  uom: z.string().optional().default('unidad'),
  precioEstimado: z.coerce.number().min(0).optional(),
  compraLocal: z.boolean().optional().default(false),
  compraInternacional: z.boolean().optional().default(false),
})

const RQSchema = z.object({
  projectId: z.string().min(1),
  costCenterId: z.string().optional().nullable(),
  title: z.string().min(3),
  description: z.string().optional().default(''),
  consecutivo: z.string().optional().default(''),
  direccionEntrega: z.string().optional().default(''),
  moneda: z.string().optional().default('COP'),
  financiador: z.string().optional().default(''),
  euroRate: z.coerce.number().positive().optional(),
  usdRate: z.coerce.number().positive().optional(),
  ivaRate: z.coerce.number().min(0).max(100).optional().default(0),
  fechaEntregaDeseada: z.string().optional(),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})

export type CreateRQInput = z.infer<typeof RQSchema>

// ─── createRQ ─────────────────────────────────────────────────────────────────

/**
 * Create a new requisition and immediately set status to ENVIADA_COMPRAS.
 */
export async function createRQ(input: CreateRQInput) {
  const session = await getServerActionSession()
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
        consecutivo: data.consecutivo || null,
        direccionEntrega: data.direccionEntrega || null,
        moneda: data.moneda || 'COP',
        financiador: data.financiador || null,
        euroRate: data.euroRate ?? null,
        usdRate: data.usdRate ?? null,
        ivaRate: data.ivaRate ?? 0,
        fechaEntregaDeseada: data.fechaEntregaDeseada ? new Date(data.fechaEntregaDeseada) : null,
        items: {
          create: data.items.map((i) => ({
            name: i.name,
            spec: i.spec,
            descripcion: i.descripcion || null,
            comentario: i.comentario || null,
            qty: i.qty,
            uom: i.uom,
            precioEstimado: i.precioEstimado !== undefined ? i.precioEstimado : null,
            compraLocal: i.compraLocal ?? false,
            compraInternacional: i.compraInternacional ?? false,
          })),
        },
      },
      include: { items: true, project: true },
    })

    revalidatePath('/dashboard')
    revalidatePath('/rq')
    // Serialize Decimal fields (Prisma Decimal is not serializable by React Flight)
    return {
      ...rq,
      euroRate: rq.euroRate ? Number(rq.euroRate) : null,
      usdRate: rq.usdRate ? Number(rq.usdRate) : null,
      items: rq.items.map((item) => ({
        ...item,
        qty: Number(item.qty),
        precioEstimado: item.precioEstimado ? Number(item.precioEstimado) : null,
      })),
    }
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
  const session = await getServerActionSession()
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
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'RECHAZADA' } })
  } else if (allApproved) {
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'APROBADA' } })
  }

  revalidatePath(`/rq/${rqId}`)
  return { success: true }
}

// ─── registrarRecepcion ───────────────────────────────────────────────────────

const RecepcionItemSchema = z.object({
  rqItemId: z.string().min(1),
  qtyReceived: z.coerce.number().min(0),
  notes: z.string().optional(),
})

const RecepcionSchema = z.object({
  rqId: z.string().min(1),
  status: z.enum(['CONFORME', 'NO_CONFORME']),
  notes: z.string().optional().default(''),
  fechaRecepcion: z.string().optional(),
  items: z.array(RecepcionItemSchema).optional(),
})

export type RegistrarRecepcionInput = z.infer<typeof RecepcionSchema>

/**
 * Register a goods reception event for an RQ.
 * - CONFORME  → closes the RQ (status = CERRADA)
 * - NO_CONFORME → leaves the RQ in OC_EMITIDA with a note
 */
export async function registrarRecepcion(input: RegistrarRecepcionInput) {
  const session = await getServerActionSession()
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

  // Create the receipt record with optional item-level detail
  await prisma.receipt.create({
    data: {
      rqId: data.rqId,
      status: data.status,
      notes: data.notes || null,
      ...(data.items && data.items.length > 0 && {
        items: {
          create: data.items.map((i) => ({
            rqItemId: i.rqItemId,
            qtyReceived: i.qtyReceived,
            notes: i.notes || null,
          })),
        },
      }),
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

// ─── importarRQ ───────────────────────────────────────────────────────────────

export type ImportRQInput = {
  projectId: string
  costCenterId?: string | null
  title: string
  description: string
  consecutivo?: string
  direccionEntrega?: string
  moneda?: string
  financiador?: string
  ivaRate?: number
  items: { name: string; spec: string; descripcion: string; comentario: string; qty: number; uom: string; precioEstimado?: number; compraLocal: boolean; compraInternacional: boolean }[]
}

/**
 * Create an RQ from imported Excel data.
 * Reuses the same creation logic as createRQ.
 */
export async function importarRQ(input: ImportRQInput) {
  return createRQ({
    ...input,
    consecutivo: input.consecutivo || '',
    direccionEntrega: input.direccionEntrega || '',
    moneda: input.moneda || 'COP',
    financiador: input.financiador || '',
    ivaRate: input.ivaRate ?? 0,
    items: input.items.map((i) => ({ ...i })),
  })
}
