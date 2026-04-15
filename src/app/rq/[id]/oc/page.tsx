'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface RQData {
  id: string
  code: string
  title: string
  status: string
  project: { name: string }
  quotes: Array<{ supplierId: string; total: number; currency: string; supplier: { id: string; name: string } }>
  comparison?: { chosenId?: string; chosen?: { id: string; name: string } }
}

export default function EmitirOCPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'COMPRAS'

  const [rq, setRq] = useState<RQData | null>(null)
  const [suggestedNumber, setSuggestedNumber] = useState('')
  const [ocNumber, setOcNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/rq/${params.id}/oc`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setRq(d.rq)
        setSuggestedNumber(d.suggestedNumber || '')
        setOcNumber(d.suggestedNumber || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const chosenQuote = rq?.quotes.find(q => q.supplierId === rq.comparison?.chosenId)
  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ocNumber.trim()) { setError('El número de OC es obligatorio'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/rq/${params.id}/oc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ocNumber }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al emitir OC'); return }
      router.push(`/rq/${params.id}?role=${role}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Emisión de Orden de Compra</p>
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
            Requisición no encontrada.
          </div>
        ) : rq.status !== 'APROBADA' ? (
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-8 text-center text-sm text-yellow-700">
            Esta RQ no está en estado APROBADA. Estado actual: <strong>{rq.status}</strong>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

            {/* Form */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-semibold text-brand-plum">Confirmar emisión de OC</h2>

              {/* Summary */}
              <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-3">Resumen de la compra</p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Proyecto</dt>
                    <dd className="font-medium text-gray-900">{rq.project.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Proveedor ganador</dt>
                    <dd className="font-medium text-gray-900">{rq.comparison?.chosen?.name ?? '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">Total a pagar</dt>
                    <dd className="text-2xl font-bold text-emerald-700">
                      {chosenQuote ? formatCOP(Number(chosenQuote.total)) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Número de Orden de Compra *
                  </label>
                  <input
                    type="text"
                    value={ocNumber}
                    onChange={e => setOcNumber(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
                    placeholder={suggestedNumber}
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Sugerido: <span className="font-mono">{suggestedNumber}</span>. Puedes modificarlo si es necesario.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !ocNumber.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Emitiendo OC…
                    </>
                  ) : (
                    'Emitir Orden de Compra'
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar: all quotes */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Cotizaciones del comparativo
              </h3>
              <div className="space-y-3">
                {rq.quotes.map(q => (
                  <div
                    key={q.supplierId}
                    className={`rounded-xl border p-3 ${q.supplierId === rq.comparison?.chosenId ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{q.supplier.name}</span>
                      {q.supplierId === rq.comparison?.chosenId && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ Ganador</span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-sm font-semibold text-brand-plum">
                      {q.currency} {Number(q.total).toLocaleString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
