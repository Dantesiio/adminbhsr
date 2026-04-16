'use server'

import { prisma } from '@/lib/prisma'
import { getServerActionSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ─── updateRQ ─────────────────────────────────────────────────────────────────

const UpdateItemSchema = z.object({
  name: z.string().min(1),
  spec: z.string().optional().default(''),
  qty: z.coerce.number().positive(),
  uom: z.string().optional().default('unidad'),
  precioEstimado: z.coerce.number().min(0).optional(),
})

const UpdateRQSchema = z.object({
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
  items: z.array(UpdateItemSchema).min(1),
})

export type UpdateRQInput = z.infer<typeof UpdateRQSchema>

export async function updateRQ(rqId: string, input: UpdateRQInput) {
  const session = await getServerActionSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const rq = await prisma.rQ.findUnique({
    where: { id: rqId },
    select: { requesterId: true, status: true },
  })
  if (!rq) throw new Error('RQ no encontrada')
  if (rq.status === 'CERRADA') throw new Error('No se puede editar una RQ cerrada')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('Usuario no encontrado')

  const isRequester = rq.requesterId === session.user.id
  const isComprasOrAdmin = ['COMPRAS', 'ADMIN'].includes(user.role)
  if (!isRequester && !isComprasOrAdmin) throw new Error('No autorizado para editar esta RQ')

  const data = UpdateRQSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    // Delete existing items and recreate
    await tx.rQItem.deleteMany({ where: { rqId } })
    await tx.rQ.update({
      where: { id: rqId },
      data: {
        title: data.title,
        description: data.description,
        consecutivo: data.consecutivo || null,
        direccionEntrega: data.direccionEntrega || null,
        moneda: data.moneda,
        financiador: data.financiador || null,
        euroRate: data.euroRate ?? null,
        usdRate: data.usdRate ?? null,
        ivaRate: data.ivaRate ?? 0,
        fechaEntregaDeseada: data.fechaEntregaDeseada ? new Date(data.fechaEntregaDeseada) : null,
        items: {
          create: data.items.map((i) => ({
            name: i.name,
            spec: i.spec,
            qty: i.qty,
            uom: i.uom,
            precioEstimado: i.precioEstimado !== undefined ? i.precioEstimado : null,
          })),
        },
      },
    })
  })

  revalidatePath(`/rq/${rqId}`)
  revalidatePath('/rq')
  revalidatePath('/dashboard')
  redirect(`/rq/${rqId}`)
}

export async function enviarACompras(rqId: string, role: string) {
  const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
  if (!rq || !['DRAFT', 'RECHAZADA'].includes(rq.status)) {
    throw new Error('La RQ debe estar en estado Borrador o Rechazada para enviarse a Compras')
  }
  await prisma.rQ.update({ where: { id: rqId }, data: { status: 'ENVIADA_COMPRAS' } })
  redirect(`/rq/${rqId}?role=${role}`)
}

export async function registrarRecepcion({
  rqId,
  status,
  notes,
  items,
}: {
  rqId: string
  status: 'CONFORME' | 'NO_CONFORME'
  notes: string
  fechaRecepcion?: string
  items?: { rqItemId: string; qtyReceived: number; notes?: string }[]
}) {
  const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
  if (!rq) throw new Error('RQ no encontrada')
  if (rq.status !== 'OC_EMITIDA') throw new Error('La RQ debe estar en estado OC Emitida para registrar recepción')

  const receipt = await prisma.receipt.create({
    data: {
      rqId,
      status,
      notes: notes || null,
      ...(items && items.length > 0 && {
        items: {
          create: items.map((i) => ({
            rqItemId: i.rqItemId,
            qtyReceived: i.qtyReceived,
            notes: i.notes || null,
          })),
        },
      }),
    },
  })

  if (status === 'CONFORME') {
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'CERRADA' } })
    return { receipt, newStatus: 'CERRADA' }
  }

  return { receipt, newStatus: 'OC_EMITIDA' }
}
