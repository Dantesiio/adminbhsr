'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function enviarACompras(rqId: string, role: string) {
  const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
  if (!rq || rq.status !== 'DRAFT') throw new Error('La RQ no está en estado Borrador')
  await prisma.rQ.update({ where: { id: rqId }, data: { status: 'ENVIADA_COMPRAS' } })
  redirect(`/rq/${rqId}?role=${role}`)
}

export async function registrarRecepcion({
  rqId,
  status,
  notes,
  fechaRecepcion: _fechaRecepcion,
}: {
  rqId: string
  status: 'CONFORME' | 'NO_CONFORME'
  notes: string
  fechaRecepcion: string
}) {
  const rq = await prisma.rQ.findUnique({ where: { id: rqId }, select: { status: true } })
  if (!rq) throw new Error('RQ no encontrada')
  if (rq.status !== 'OC_EMITIDA') throw new Error('La RQ debe estar en estado OC Emitida para registrar recepción')

  const receipt = await prisma.receipt.create({
    data: { rqId, status, notes: notes || null },
  })

  if (status === 'CONFORME') {
    await prisma.rQ.update({ where: { id: rqId }, data: { status: 'CERRADA' } })
    return { receipt, newStatus: 'CERRADA' }
  }

  return { receipt, newStatus: 'OC_EMITIDA' }
}
