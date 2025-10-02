import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'
import { getStageByStatus, workflowStages } from '@/lib/workflow'

interface PageProps {
  params: { id: string }
  searchParams: { role?: string }
}

export default async function RQDetailPage({ params, searchParams }: PageProps) {
  const rq = await prisma.rQ.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      project: true,
      costCenter: true,
      requester: true,
      quotes: {
        include: {
          supplier: true,
          items: true,
        },
      },
      comparison: {
        include: {
          chosen: true,
        },
      },
      approvals: true,
      po: {
        include: {
          supplier: true,
        },
      },
    },
  })

  if (!rq) {
    notFound()
  }

  const role = searchParams.role?.toUpperCase() || 'USER'
  const stage = getStageByStatus(rq.status)

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ENVIADA_COMPRAS: 'bg-blue-100 text-blue-800',
      EN_COMPARATIVO: 'bg-yellow-100 text-yellow-800',
      EN_AUTORIZACION: 'bg-orange-100 text-orange-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      OC_EMITIDA: 'bg-purple-100 text-purple-800',
      EN_RECEPCION: 'bg-indigo-100 text-indigo-800',
      CERRADA: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout currentRole={role}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">RQ</span>
                <span className="text-xs font-semibold text-slate-500">{rq.code}</span>
              </div>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{rq.title}</h1>
              <p className="mt-1 text-sm text-slate-500">Creada el {new Date(rq.createdAt).toLocaleDateString('es-CO')}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${getStatusColor(rq.status)}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                {rq.status.replace(/_/g, ' ')}
              </span>
              {stage && (
                <div className="text-xs text-slate-500 max-w-xs text-right">
                  {stage.description}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {role === 'COMPRAS' && ['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(rq.status) && (
                  <Link
                    href={`/rq/${rq.id}/quotes?role=${role}`}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Gestionar Cotizaciones
                  </Link>
                )}
                {role === 'AUTORIZADOR' && rq.status === 'EN_AUTORIZACION' && (
                  <Link
                    href={`/rq/${rq.id}/approve?role=${role}`}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
                  >
                    Revisar y Aprobar
                  </Link>
                )}
              </div>
            </div>
          </div>
          <WorkflowTimeline currentStatus={rq.status} />
        </div>

        {/* Basic Information */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="block text-sm font-medium text-gray-700">Proyecto</div>
              <p className="text-sm text-gray-900">{rq.project.name}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700">Centro de Costo</div>
              <p className="text-sm text-gray-900">{rq.costCenter?.name || 'N/A'}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700">Solicitante</div>
              <p className="text-sm text-gray-900">{rq.requester.name}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700">Fecha de Creación</div>
              <p className="text-sm text-gray-900">{new Date(rq.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {rq.description && (
            <div className="mt-4">
              <div className="block text-sm font-medium text-gray-700">Descripción</div>
              <p className="text-sm text-gray-900">{rq.description}</p>
            </div>
          )}
        </div>

        {stage && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-blue-900 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-600">Pasos sugeridos</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {stage.guidance.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Responsable</h3>
              <p className="mt-2 font-semibold text-slate-900">{workflowStages[rq.status as keyof typeof workflowStages]?.actor || 'Equipo'}</p>
              <p className="mt-1 text-xs text-slate-500">Asegúrate de coordinar con las áreas involucradas para evitar retrabajos.</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Ítems Solicitados</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rq.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.spec || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.qty.toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.uom || 'unidad'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quotes Section */}
        {rq.quotes.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Cotizaciones Recibidas</h2>
            <div className="space-y-4">
              {rq.quotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{quote.supplier.name}</h3>
                    <span className="text-lg font-bold text-gray-900">
                      {quote.currency} {quote.total.toLocaleString()}
                    </span>
                  </div>
                  {quote.notes && (
                    <p className="text-sm text-gray-600 mb-2">{quote.notes}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Recibida: {new Date(quote.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Section */}
        {rq.comparison && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Comparativo</h2>
            <div className="space-y-2">
              {rq.comparison.chosen && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Proveedor Seleccionado:</span>
                  <span className="text-sm text-gray-900">{rq.comparison.chosen.name}</span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    ELEGIDO
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Comparativo creado: {new Date(rq.comparison.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Purchase Order Section */}
        {rq.po && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Orden de Compra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-700">Número OC</div>
                <p className="text-sm text-gray-900">{rq.po.number}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">Proveedor</div>
                <p className="text-sm text-gray-900">{rq.po.supplier.name}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">Total</div>
                <p className="text-sm text-gray-900">
                  {rq.po.currency} {rq.po.total.toLocaleString()}
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">Fecha de Emisión</div>
                <p className="text-sm text-gray-900">
                  {new Date(rq.po.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
