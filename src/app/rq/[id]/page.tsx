import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'
import { getStageByStatus } from '@/lib/workflow'
import { enviarACompras } from './actions'

interface PageProps {
  params: { id: string }
  searchParams: { role?: string }
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:             { label: 'Borrador',     className: 'bg-gray-100 text-gray-600' },
  ENVIADA_COMPRAS:   { label: 'En Compras',   className: 'bg-blue-100 text-blue-700' },
  EN_COMPARATIVO:    { label: 'Comparativo',  className: 'bg-yellow-100 text-yellow-700' },
  EN_AUTORIZACION:   { label: 'Autorización', className: 'bg-orange-100 text-orange-700' },
  APROBADA:          { label: 'Aprobada',     className: 'bg-green-100 text-green-700' },
  OC_EMITIDA:        { label: 'OC Emitida',   className: 'bg-teal-100 text-teal-700' },
  EN_RECEPCION:      { label: 'En Recepción', className: 'bg-indigo-100 text-indigo-700' },
  CERRADA:           { label: 'Cerrada',      className: 'bg-gray-200 text-gray-600' },
  RECHAZADA:         { label: 'Rechazada',    className: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${cfg.className}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="font-semibold text-brand-plum">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Info grid item ───────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RQDetailPage({ params, searchParams }: PageProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rq: any = null
  try {
    rq = await prisma.rQ.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        project: true,
        costCenter: true,
        requester: true,
        quotes: { include: { supplier: true, items: true } },
        comparison: { include: { chosen: true } },
        approvals: { include: { approver: true }, orderBy: { createdAt: 'desc' } },
        po: { include: { supplier: true } },
        receipts: { orderBy: { createdAt: 'desc' } },
      },
    })
  } catch {
    // DB not available
  }

  if (!rq) notFound()

  const role = (searchParams.role?.toUpperCase() || 'USER') as string
  // Show edit button for solicitante, compras, and admin roles — the edit page does the real auth check
  const canEdit = rq.status !== 'CERRADA' && ['SOLICITANTE', 'COMPRAS', 'ADMIN'].includes(role)
  const stage = getStageByStatus(rq.status)

  // Parse unit price from spec (stored as "Precio unitario: $XX,XXX · ...")
  function parsePrice(spec?: string | null): number {
    if (!spec) return 0
    const m = spec.match(/Precio unitario:\s*\$([\d.,]+)/i)
    if (!m) return 0
    return parseFloat(m[1].replace(/\./g, '').replace(',', '.')) || 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalEstimado = rq.items.reduce((acc: number, item: any) => {
    const price = parsePrice(item.spec)
    return acc + price * Number(item.qty)
  }, 0)

  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* ── RQ Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-magenta via-brand-magentaDark to-brand-purple p-7 text-white shadow-xl shadow-brand-magenta/20">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            {/* Code + status */}
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-bold text-white/60">{rq.code}</span>
              <StatusBadge status={rq.status} />
            </div>
            <h1 className="text-2xl font-bold leading-tight">{rq.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
              <span>Proyecto: <strong className="text-white">{rq.project.name}</strong></span>
              <span>Solicitante: <strong className="text-white">{rq.requester.name || rq.requester.email}</strong></span>
              <span>Creada: <strong className="text-white">{new Date(rq.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
            </div>
          </div>
        </div>

        {/* ── Workflow timeline ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <WorkflowTimeline currentStatus={rq.status} />
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap gap-3">
          {/* DRAFT → Enviar a Compras */}
          {rq.status === 'DRAFT' && ['SOLICITANTE', 'ADMIN'].includes(role) && (
            <form action={enviarACompras.bind(null, rq.id, role)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar a Compras
              </button>
            </form>
          )}
          {/* RECHAZADA → Reenviar a Compras */}
          {rq.status === 'RECHAZADA' && ['SOLICITANTE', 'ADMIN'].includes(role) && (
            <form action={enviarACompras.bind(null, rq.id, role)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reenviar a Compras
              </button>
            </form>
          )}
          {role === 'COMPRAS' && ['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(rq.status) && (
            <Link
              href={`/rq/${rq.id}/quotes?role=${role}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gestionar Cotizaciones
            </Link>
          )}
          {role === 'AUTORIZADOR' && rq.status === 'EN_AUTORIZACION' && (
            <Link
              href={`/rq/${rq.id}/approve?role=${role}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revisar y Aprobar
            </Link>
          )}
          {/* APROBADA → Emitir OC */}
          {['COMPRAS', 'ADMIN'].includes(role) && rq.status === 'APROBADA' && (
            <Link
              href={`/rq/${rq.id}/oc?role=${role}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Emitir Orden de Compra
            </Link>
          )}
          {(role === 'COMPRAS' || role === 'ADMIN') && rq.status === 'OC_EMITIDA' && (
            <Link
              href={`/rq/${rq.id}/recepcion?role=${role}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Registrar Recepción
            </Link>
          )}
          {rq.status === 'CERRADA' && (
            <a
              href={`/api/rq/${rq.id}/recibo.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-magenta/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-magenta shadow-sm transition hover:bg-brand-magentaLight"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Descargar recibo PDF
            </a>
          )}
          <a
            href={`/api/rq/${rq.id}/rq.pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-magenta/30 px-4 py-2 text-sm font-semibold text-brand-magenta hover:bg-brand-magentaLight transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar RQ
          </a>
          {canEdit && (
            <Link
              href={`/rq/${rq.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar RQ
            </Link>
          )}
          <Link
            href="/rq"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            ← Volver a RQs
          </Link>
        </div>

        {/* ── Información general ── */}
        <Section title="Información general">
          <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <InfoItem label="Proyecto" value={rq.project.name} />
            <InfoItem label="Centro de Costo" value={rq.costCenter?.name} />
            <InfoItem label="Solicitante" value={rq.requester.name || rq.requester.email} />
            <InfoItem label="Fecha de creación" value={new Date(rq.createdAt).toLocaleDateString('es-CO')} />
          </dl>
          {rq.description && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Descripción</dt>
              <dd className="text-sm text-gray-700 leading-relaxed">{rq.description}</dd>
            </div>
          )}
          {stage && (
            <div className="mt-5 rounded-xl border border-brand-magenta/20 bg-brand-magentaLight/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-magenta">Etapa actual · {stage.label}</p>
              <ul className="mt-2 space-y-1.5">
                {stage.guidance.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-brand-plum">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* ── Ítems ── */}
        <Section title={`Ítems solicitados (${rq.items.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Descripción técnica</th>
                  <th className="px-4 py-3 text-left">Comentario</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-left">Unidad</th>
                  <th className="px-4 py-3 text-right">Precio Unit</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-center">Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {rq.items.map((item: any, idx: number) => {
                  const price = parsePrice(item.spec)
                  const rowTotal = price * Number(item.qty)
                  return (
                    <tr key={item.id} className="hover:bg-brand-magentaLight/20 transition">
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="block text-sm font-medium text-gray-900">{item.name}</span>
                        {item.spec && <span className="block text-xs text-gray-400 mt-0.5">LP: {item.spec}</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <span className="block text-xs text-gray-600 leading-relaxed">{item.descripcion || '—'}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <span className="block text-xs text-gray-600 leading-relaxed">{item.comentario || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-900">{Number(item.qty).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.uom || 'unidad'}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">
                        {price > 0 ? formatCOP(price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-brand-plum">
                        {rowTotal > 0 ? formatCOP(rowTotal) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {item.compraLocal && <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium">Local</span>}
                        {item.compraInternacional && <span className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 font-medium ml-1">Intl.</span>}
                        {!item.compraLocal && !item.compraInternacional && <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {totalEstimado > 0 && (
                <tfoot>
                  <tr className="border-t border-brand-magenta/20 bg-brand-magentaLight/30">
                    <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-brand-plum">
                      Total estimado
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base font-bold text-brand-magenta">
                      {formatCOP(totalEstimado)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Section>

        {/* ── Cotizaciones ── */}
        {rq.quotes.length > 0 && (
          <Section title={`Cotizaciones (${rq.quotes.length})`}>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {rq.quotes.map((quote: any) => (
                <div key={quote.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-brand-magentaLight/10 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{quote.supplier.name}</p>
                    {quote.notes && <p className="mt-0.5 text-sm text-gray-500">{quote.notes}</p>}
                    <p className="mt-0.5 text-xs text-gray-400">
                      Recibida: {new Date(quote.createdAt).toLocaleDateString('es-CO')}
                      {quote.validez && ` · Válida hasta: ${new Date(quote.validez).toLocaleDateString('es-CO')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-brand-plum">
                      {quote.currency} {Number(quote.total).toLocaleString('es-CO')}
                    </span>
                    {rq.comparison?.chosenId === quote.supplierId && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        ✓ Elegido
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Aprobaciones ── */}
        {rq.approvals.length > 0 && (
          <Section title={`Historial de aprobaciones (${rq.approvals.length})`}>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {rq.approvals.map((approval: any) => (
                <div key={approval.id} className="flex flex-col gap-1 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {approval.approver?.name || 'Autorizador'}
                    </p>
                    {approval.comment && (
                      <p className="mt-1 text-sm text-gray-600 italic">&ldquo;{approval.comment}&rdquo;</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(approval.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    approval.status === 'APROBADO' ? 'bg-green-100 text-green-700' :
                    approval.status === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {approval.status}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Orden de Compra ── */}
        {rq.po && (
          <Section title="Orden de Compra">
            <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <InfoItem label="N° Orden" value={rq.po.number} />
              <InfoItem label="Proveedor" value={rq.po.supplier.name} />
              <InfoItem label="Total" value={`${rq.po.currency} ${Number(rq.po.total).toLocaleString('es-CO')}`} />
              <InfoItem label="Fecha emisión" value={new Date(rq.po.createdAt).toLocaleDateString('es-CO')} />
            </dl>
            <div className="mt-4">
              <a
                href={`/api/rq/${rq.id}/oc.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Descargar OC PDF
              </a>
            </div>
          </Section>
        )}

        {/* ── Recepciones ── */}
        {rq.receipts.length > 0 && (
          <Section title={`Recepciones registradas (${rq.receipts.length})`}>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {rq.receipts.map((receipt: any) => (
                <div key={receipt.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-brand-magentaLight/10 transition">
                  <div>
                    {receipt.notes && <p className="text-sm text-gray-600">{receipt.notes}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(receipt.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    receipt.status === 'CONFORME' ? 'bg-green-100 text-green-700' :
                    receipt.status === 'NO_CONFORME' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {receipt.status}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </Layout>
  )
}
