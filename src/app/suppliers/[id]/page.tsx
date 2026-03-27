import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supplier: any = null
  try {
    supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        quotes: {
          include: { rq: { select: { id: true, code: true, title: true, status: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        pos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  } catch { /* DB error */ }

  if (!supplier) notFound()

  const totalOCs = supplier.pos.length
  const totalCotizaciones = supplier.quotes.length
  const volumenTotal = supplier.pos.reduce((sum: number, po: any) => sum + Number(po.total), 0)
  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Borrador', ENVIADA_COMPRAS: 'En Compras', EN_COMPARATIVO: 'Comparativo',
    EN_AUTORIZACION: 'Autorización', APROBADA: 'Aprobada', OC_EMITIDA: 'OC Emitida', CERRADA: 'Cerrada',
  }

  return (
    <Layout currentRole="COMPRAS">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/suppliers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Proveedores
            </Link>
          </div>
          <Link
            href={`/suppliers/${supplier.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>

        {/* Profile card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{supplier.name}</h1>
                {supplier.nit && <p className="text-sm text-white/70">NIT: {supplier.nit}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{totalCotizaciones}</p>
              <p className="mt-1 text-xs text-blue-600">Cotizaciones</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{totalOCs}</p>
              <p className="mt-1 text-xs text-indigo-600">Órdenes de Compra</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-lg font-bold text-emerald-700">{volumenTotal > 0 ? formatCOP(volumenTotal) : '—'}</p>
              <p className="mt-1 text-xs text-emerald-600">Volumen total comprado</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Información de contacto</h2>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">NIT</p>
              <p className="mt-1 text-sm text-gray-900">{supplier.nit || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
              <p className="mt-1 text-sm text-gray-900">{supplier.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono</p>
              <p className="mt-1 text-sm text-gray-900">{supplier.phone || '—'}</p>
            </div>
          </div>
        </div>

        {/* Quote history */}
        {supplier.quotes.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Historial de cotizaciones ({supplier.quotes.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">RQ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado RQ</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total cotizado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {supplier.quotes.map((quote: any) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        <Link href={`/rq/${quote.rq.id}?role=COMPRAS`} className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-800">
                          {quote.rq.code}
                        </Link>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{quote.rq.title}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {STATUS_LABELS[quote.rq.status] ?? quote.rq.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-semibold text-gray-900">
                        {formatCOP(Number(quote.total))}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PO history */}
        {supplier.pos.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Órdenes de Compra emitidas ({supplier.pos.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">N° OC</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {supplier.pos.map((po: any) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-mono text-sm font-semibold text-gray-900">{po.number}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-semibold text-emerald-700">{formatCOP(Number(po.total))}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(po.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {supplier.quotes.length === 0 && supplier.pos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
            Este proveedor aún no tiene cotizaciones ni órdenes de compra registradas.
          </div>
        )}
      </div>
    </Layout>
  )
}
