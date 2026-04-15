'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { getRoleFromQuery } from '@/lib/roles'

type RQRow = {
  id: string
  code: string
  title: string
  status: string
  createdAt: string | Date
  project: string
  requester: string
  itemCount: number
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:           { label: 'Borrador',    className: 'bg-gray-100 text-gray-600' },
  ENVIADA_COMPRAS: { label: 'En Compras',  className: 'bg-blue-100 text-blue-700' },
  EN_COMPARATIVO:  { label: 'Comparativo', className: 'bg-yellow-100 text-yellow-700' },
  EN_AUTORIZACION: { label: 'Autorización',className: 'bg-orange-100 text-orange-700' },
  APROBADA:        { label: 'Aprobada',    className: 'bg-green-100 text-green-700' },
  OC_EMITIDA:      { label: 'OC Emitida', className: 'bg-teal-100 text-teal-700' },
  CERRADA:         { label: 'Cerrada',     className: 'bg-gray-200 text-gray-600' },
  RECHAZADA:       { label: 'Rechazada',  className: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  )
}

function RQListContent() {
  const searchParams = useSearchParams()
  const role = getRoleFromQuery(searchParams)
  const [rqs, setRqs] = useState<RQRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const limit = 15

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/rq?${params}`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then((d) => { if (d) { setRqs(d.rqs ?? []); setTotal(d.total ?? 0) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-plum">Requisiciones</h1>
          <p className="mt-0.5 text-sm text-brand-plum/60">
            {total > 0 ? `${total} registros` : 'Listado completo'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-magenta focus:outline-none focus:ring-2 focus:ring-brand-magenta/20"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          {(role === 'SOLICITANTE' || role === 'ADMIN') && (
            <Link
              href="/rq/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva RQ
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 text-left">N° RQ</th>
                <th className="px-4 py-3 text-left">Título / Proyecto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Solicitante</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Ítems</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                : rqs.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      No hay requisiciones para mostrar.
                    </td>
                  </tr>
                )
                : rqs.map((rq) => (
                  <tr key={rq.id} className="group transition hover:bg-brand-magentaLight/40">
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm font-semibold text-brand-plum">{rq.code}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate text-sm font-medium text-gray-900" title={rq.title}>{rq.title}</p>
                      <p className="truncate text-xs text-gray-400" title={rq.project}>{rq.project}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rq.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{rq.requester}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(rq.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{rq.itemCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/rq/${rq.id}?role=${role}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-magenta/30 px-3 py-1 text-xs font-semibold text-brand-magenta transition hover:bg-brand-magentaLight"
                      >
                        Ver
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">
              Página {page} de {totalPages} · {total} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RQListPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      }>
        <RQListContent />
      </Suspense>
    </Layout>
  )
}
