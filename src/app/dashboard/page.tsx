'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { getRoleFromQuery } from '@/lib/roles'

// ─── Types ────────────────────────────────────────────────────────────────────

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

type KPIs = {
  total: number
  inProcess: number
  approved: number
  closed: number
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:             { label: 'Borrador',         className: 'bg-gray-100 text-gray-600' },
  ENVIADA_COMPRAS:   { label: 'En Compras',        className: 'bg-blue-100 text-blue-700' },
  EN_COMPARATIVO:    { label: 'Comparativo',       className: 'bg-yellow-100 text-yellow-700' },
  EN_AUTORIZACION:   { label: 'Autorización',      className: 'bg-orange-100 text-orange-700' },
  APROBADA:          { label: 'Aprobada',          className: 'bg-green-100 text-green-700' },
  OC_EMITIDA:        { label: 'OC Emitida',        className: 'bg-teal-100 text-teal-700' },
  EN_RECEPCION:      { label: 'En Recepción',      className: 'bg-indigo-100 text-indigo-700' },
  CERRADA:           { label: 'Cerrada',           className: 'bg-gray-200 text-gray-600' },
  RECHAZADA:         { label: 'Rechazada',         className: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
      <div className="h-8 w-16 rounded bg-gray-200 mb-1" />
      <div className="h-2.5 w-28 rounded bg-gray-100" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100" style={{ width: `${50 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: number
  description: string
  gradient: string
  icon: JSX.Element
}

function KPICard({ label, value, description, gradient, icon }: KPICardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient}`}>
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-white/10" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{label}</span>
          <span className="rounded-lg bg-white/20 p-1.5 text-white">{icon}</span>
        </div>
        <div className="text-4xl font-bold tabular-nums">{value.toLocaleString()}</div>
        <p className="mt-1 text-xs text-white/70">{description}</p>
      </div>
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams()
  const role = getRoleFromQuery(searchParams)

  const [rqs, setRqs] = useState<RQRow[]>([])
  const [kpis, setKpis] = useState<KPIs>({ total: 0, inProcess: 0, approved: 0, closed: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    setLoading(true)
    fetch(`/api/rq?page=${page}&limit=${limit}`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setRqs(d.rqs || [])
        setKpis(d.kpis || { total: 0, inProcess: 0, approved: 0, closed: 0 })
        setTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / limit)

  const kpiCards = [
    {
      label: 'Total RQs',
      value: kpis.total,
      description: 'Requisiciones registradas',
      gradient: 'bg-gradient-to-br from-brand-magenta to-brand-purple',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'En Proceso',
      value: kpis.inProcess,
      description: 'Activas en el flujo',
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Aprobadas',
      value: kpis.approved,
      description: 'Listas para orden de compra',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Cerradas',
      value: kpis.closed,
      description: 'Proceso completado',
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-plum">Dashboard</h1>
          <p className="mt-0.5 text-sm text-brand-plum/60">
            Vista general de requisiciones · Rol: <span className="font-semibold text-brand-magenta">{role}</span>
          </p>
        </div>
        {(role === 'SOLICITANTE' || role === 'ADMIN') && (
          <Link
            href="/rq/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-magenta/30 transition hover:opacity-90 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva RQ
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((card) => <KPICard key={card.label} {...card} />)}
      </div>

      {/* Recent RQs table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-brand-plum">Requisiciones recientes</h2>
          <Link
            href="/rq"
            className="text-xs font-semibold text-brand-magenta hover:text-brand-magentaDark transition"
          >
            Ver todas →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">N° RQ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Ítems</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : rqs.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                      No hay requisiciones para mostrar.
                    </td>
                  </tr>
                )
                : rqs.map((rq) => (
                  <tr
                    key={rq.id}
                    className="group transition hover:bg-brand-magentaLight/40"
                  >
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm font-semibold text-brand-plum">{rq.code}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="block truncate text-sm text-gray-700" title={rq.project}>{rq.project}</span>
                      <span className="block truncate text-xs text-gray-400" title={rq.title}>{rq.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rq.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(rq.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{rq.itemCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/rq/${rq.id}?role=${role}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-magenta/20 px-3 py-1 text-xs font-semibold text-brand-magenta opacity-0 transition hover:bg-brand-magentaLight group-hover:opacity-100"
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
              Mostrando {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} de {total}
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

export default function DashboardPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </Layout>
  )
}
