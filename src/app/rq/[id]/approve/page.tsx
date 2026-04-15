'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface RQ {
  id: string
  code: string
  title: string
  status: string
  project: { name: string }
  requester: { name?: string; email: string }
  comparison?: {
    chosen?: { name: string }
  }
  quotes: Array<{ supplierId: string; total: number; currency: string; supplier: { name: string } }>
  approvals: Array<{ id: string; status: string; comment?: string; approver?: { name?: string }; createdAt: string }>
}

export default function RQApprovePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'AUTORIZADOR'

  const [rq, setRQ] = useState<RQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/rq/${params.id}/approve`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then(d => { if (d) setRQ(d.rq) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const handleApproval = async (decision: 'APROBADA' | 'RECHAZADA') => {
    if (!comment.trim()) { setError('El comentario es obligatorio'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/rq/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ decision, comment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al procesar'); return }
      router.push(`/rq/${params.id}?role=${role}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const chosenQuote = rq?.quotes.find(q => q.supplierId === rq.comparison?.chosen?.['id' as keyof typeof rq.comparison.chosen])
  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Autorización</p>
            <h1 className="mt-2 text-2xl font-bold">
              {loading ? '…' : rq?.code ?? params.id}
            </h1>
            {rq && <p className="mt-1 text-sm text-white/75 line-clamp-1">{rq.title}</p>}
          </div>
        </div>

        <Link
          href={`/rq/${params.id}?role=${role}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-magenta hover:text-brand-magentaDark transition"
        >
          ← Volver al detalle de la RQ
        </Link>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400">Cargando…</div>
        ) : !rq ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
            Requisición no encontrada o no disponible.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* Main */}
            <div className="space-y-6">

              {/* RQ summary */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-brand-plum">Resumen de la requisición</h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Proyecto</dt>
                    <dd className="mt-1 text-gray-900">{rq.project.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Solicitante</dt>
                    <dd className="mt-1 text-gray-900">{rq.requester.name || rq.requester.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Proveedor recomendado</dt>
                    <dd className="mt-1 font-medium text-gray-900">{rq.comparison?.chosen?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Valor cotizado</dt>
                    <dd className="mt-1 text-lg font-bold text-brand-plum">
                      {chosenQuote ? formatCOP(Number(chosenQuote.total)) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Checklist */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-brand-plum">Lista de verificación</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Presupuesto disponible', desc: 'El proyecto tiene recursos suficientes para la compra' },
                    { label: 'Justificación adecuada', desc: 'La necesidad y el proveedor seleccionado están bien soportados' },
                    { label: 'Proveedor calificado', desc: 'Documentos al día, auditorías y antecedentes verificados' },
                    { label: 'Precios de mercado', desc: 'Valores comparados contra histórico y cotizaciones alternativas' },
                  ].map(item => (
                    <label key={item.label} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Decision */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-brand-plum">Decisión de autorización</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Comentarios *
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition"
                      placeholder="Agregue sus comentarios sobre la decisión…"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleApproval('APROBADA')}
                      disabled={submitting || !comment.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                      Aprobar RQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval('RECHAZADA')}
                      disabled={submitting || !comment.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Rechazar RQ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">

              {/* All quotes */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Cotizaciones recibidas ({rq.quotes.length})
                </h3>
                {rq.quotes.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin cotizaciones</p>
                ) : (
                  <div className="space-y-3">
                    {rq.quotes.map(q => (
                      <div key={q.supplierId} className={`rounded-xl border p-3 ${rq.comparison?.chosen?.name === q.supplier.name ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{q.supplier.name}</span>
                          {rq.comparison?.chosen?.name === q.supplier.name && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Elegido</span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-sm font-semibold text-brand-plum">
                          {q.currency} {Number(q.total).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous approvals */}
              {rq.approvals.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Historial de decisiones
                  </h3>
                  <div className="space-y-3">
                    {rq.approvals.map(a => (
                      <div key={a.id} className="rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">{a.approver?.name ?? 'Autorizador'}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            a.status === 'APROBADO' ? 'bg-green-100 text-green-700' :
                            a.status === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{a.status}</span>
                        </div>
                        {a.comment && <p className="mt-1 text-xs text-gray-500 italic">&ldquo;{a.comment}&rdquo;</p>}
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(a.createdAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
