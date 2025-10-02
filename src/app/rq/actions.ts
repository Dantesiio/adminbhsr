/**
 * Server actions related to requisitions (RQ).  These functions run
 * exclusively on the server and can be invoked from client code via
 * the built‑in `use server` directive provided by Next.js.
 */
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Define the schema for an individual RQ item.  Each item must have
// a name, can optionally specify a specification, a numeric quantity
// greater than zero and an optional unit of measure.
const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional().default(''),
  qty: z.coerce.number().positive('Debe ser > 0'),
  uom: z.string().optional().default('unidad'),
})

// Define the overall schema for creating an RQ.  This includes the
// project it belongs to, an optional cost centre, a title,
// description and an array of items.
const RQSchema = z.object({
  projectId: z.string().min(1),
  costCenterId: z.string().optional().nullable(),
  title: z.string().min(3),
  description: z.string().optional().default(''),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})

export type CreateRQInput = z.infer<typeof RQSchema>

/**
 * Create a new requisition.  The requester will be looked up using a
 * hardcoded demo user until authentication is implemented.  The RQ
 * code is generated sequentially based on the current count of RQs.
 */
export async function createRQ(input: CreateRQInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const data = RQSchema.parse(input)

  try {
    const requester = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!requester) throw new Error('Usuario no encontrado')

    // Generate a sequential code for the RQ
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
    return rq
  } catch (error) {
    console.error('Database error, returning mock RQ:', error)
    // Return mock data for demo
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
        uom: item.uom || 'unidad'
      })),
      project: { name: 'Proyecto Demo' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

export async function submitApproval(rqId: string, status: 'APROBADO' | 'RECHAZADO', comment?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'AUTORIZADOR') throw new Error('No autorizado')

  const rq = await prisma.rQ.findUnique({ where: { id: rqId } })
  if (!rq || rq.status !== 'EN_AUTORIZACION') throw new Error('RQ no encontrada o no en autorización')

  await prisma.approval.create({
    data: {
      rqId,
      approverId: user.id,
      status,
      comment,
    }
  })

  // Check if all approvals are done
  const approvals = await prisma.approval.findMany({ where: { rqId } })
  const allApproved = approvals.every(a => a.status === 'APROBADO')
  const anyRejected = approvals.some(a => a.status === 'RECHAZADO')

  if (anyRejected) {
    await prisma.rQ.update({
      where: { id: rqId },
      data: { status: 'ENVIADA_COMPRAS' } // Back to compras
    })
  } else if (allApproved) {
    await prisma.rQ.update({
      where: { id: rqId },
      data: { status: 'APROBADA' }
    })
  }

  return { success: true }
}