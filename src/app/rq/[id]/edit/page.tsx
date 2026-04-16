import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getServerActionSession } from '@/lib/auth'
import EditRQForm from './EditRQForm'

interface PageProps {
  params: { id: string }
}

export default async function EditRQPage({ params }: PageProps) {
  const session = await getServerActionSession()
  if (!session?.user?.id) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rq: any = null
  try {
    rq = await prisma.rQ.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { name: 'asc' } },
        project: true,
        costCenter: true,
      },
    })
  } catch { /* DB not available */ }

  if (!rq) notFound()

  if (rq.status === 'CERRADA') redirect(`/rq/${params.id}`)

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const isRequester = rq.requesterId === session.user.id
  const isComprasOrAdmin = ['COMPRAS', 'ADMIN'].includes(user?.role || '')

  if (!isRequester && !isComprasOrAdmin) redirect(`/rq/${params.id}`)

  const rqData = {
    id: rq.id,
    code: rq.code,
    title: rq.title,
    description: rq.description || '',
    consecutivo: rq.consecutivo || '',
    direccionEntrega: rq.direccionEntrega || '',
    moneda: rq.moneda || 'COP',
    financiador: rq.financiador || '',
    euroRate: rq.euroRate ? Number(rq.euroRate) : undefined,
    usdRate: rq.usdRate ? Number(rq.usdRate) : undefined,
    ivaRate: rq.ivaRate ? Number(rq.ivaRate) : 0,
    fechaEntregaDeseada: rq.fechaEntregaDeseada
      ? new Date(rq.fechaEntregaDeseada).toISOString().split('T')[0]
      : '',
    projectId: rq.projectId,
    projectName: rq.project.name,
    costCenterId: rq.costCenterId || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: rq.items.map((item: any) => ({
      name: item.name,
      spec: item.spec || '',
      descripcion: item.descripcion || '',
      comentario: item.comentario || '',
      qty: Number(item.qty),
      uom: item.uom || 'unidad',
      unitPrice: item.precioEstimado ? Number(item.precioEstimado) : 0,
      compraLocal: item.compraLocal ?? false,
      compraInternacional: item.compraInternacional ?? false,
    })),
  }

  return <EditRQForm rq={rqData} />
}
