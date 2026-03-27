'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface RQItem { id: string; name: string; spec?: string; qty: number; uom?: string }
interface Supplier { id: string; name: string; nit?: string; email?: string; phone?: string }
interface Quote {
  id: string
  supplierId: string
  supplier: { id: string; name: string }
  currency: string
  total: number
  validez?: string
  leadTime?: string
  notes?: string
  createdAt: string
}
interface RQ {
  id: string; code: string; title: string; status: string
  items: RQItem[]
  project: { name: string }
  quotes: Quote[]
  comparison: { chosenId: string | null } | null
}

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

export default function RQQuotesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const role = useSearchParams().get('role') || 'COMPRAS'

  const [rq, setRq] = useState<RQ | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState('')
  const [chosenId, setChosenId] = useState<string | null>(null)

  // Form state
  const [supplierId, setSupplierId] = useState('')
  const [total, setTotal] = useState('')
  const [validez, setValidez] = useState('')
  const [leadTime, setLeadTime] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rq/${params.id}/quotes`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setRq(data.rq)
      setSuppliers(data.suppliers)
      setChosenId(data.rq.comparison?.chosenId ?? null)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { load() }, [load])

  // Already-quoted supplier IDs
  const quotedIds = rq?.quotes.map(q => q.supplierId) ?? []
  const availableSuppliers = suppliers.filter(s => !quotedIds.includes(s.id))

  async function handleAddQuote(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !total) { setError('Proveedor y total son obligatorios'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/rq/${params.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ supplierId, total: parseFloat(total.replace(/\./g, '').replace(',', '.')), validez: validez || null, leadTime: leadTime || null, notes: notes || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); return }
      // Reset form
      setSupplierId(''); setTotal(''); setValidez(''); setLeadTime(''); setNotes('')
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectWinner() {
    if (!chosenId) { setError('Selecciona el proveedor ganador'); return }
    if ((rq?.quotes.length ?? 0) < 2) { setError('Se necesitan al menos 2 cotizaciones'); return }
    setSelecting(true); setError('')
    try {
      const res = await fetch(`/api/rq/${params.id}/comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chosenSupplierId: chosenId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); return }
      router.push(`/rq/${params.id}?role=${role}`)
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <Layout currentRole={role}>
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </Layout>
    )
  }

  if (!rq) {
    return (
      <Layout currentRole={role}>
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">RQ no encontrada</div>
      </Layout>
    )
  }

  const canAddMore = availableSuppliers.length > 0 && ['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(rq.status)
  const canSelectWinner = rq.quotes.length >= 2 && rq.status === 'EN_COMPARATIVO'
  const alreadySelected = !!rq.comparison?.chosenId

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/rq/${params.id}?role=${role}`} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white/90 transition">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {rq.code}
              </Link>
              <h1 className="mt-1 text-2xl font-bold">Cotizaciones</h1>
              <p className="mt-1 text-sm text-white/70">{rq.title} · {rq.project.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canAddMore && (
                <button onClick={() => { setShowForm(true); setError('') }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow hover:shadow-md transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar cotización
                </button>
              )}
              {canSelectWinner && !alreadySelected && (
                <button onClick={handleSelectWinner} disabled={!chosenId || selecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition disabled:opacity-50">
                  {selecting ? 'Enviando…' : '✓ Enviar a Autorización'}
                </button>
              )}
            </div>
          </div>
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
            <span className={rq.quotes.length >= 1 ? 'text-white' : ''}>1 cotización</span>
            <span>→</span>
            <span className={rq.quotes.length >= 2 ? 'text-white' : ''}>2 cotizaciones (mínimo)</span>
            <span>→</span>
            <span className={alreadySelected ? 'text-white' : ''}>Ganador seleccionado → Autorización</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Quotes list */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Cotizaciones recibidas</h2>
                <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
                  {rq.quotes.length} {rq.quotes.length === 1 ? 'cotización' : 'cotizaciones'}
                </span>
              </div>

              {rq.quotes.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-gray-400">Aún no hay cotizaciones. Agrega la primera con el botón de arriba.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {rq.quotes.map(quote => {
                    const isChosen = chosenId === quote.supplierId
                    return (
                      <div key={quote.id} className={`flex items-start justify-between gap-4 px-6 py-4 transition ${isChosen ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          {/* Radio to select winner */}
                          {canSelectWinner && !alreadySelected && (
                            <input type="radio" name="winner" value={quote.supplierId}
                              checked={isChosen}
                              onChange={() => setChosenId(quote.supplierId)}
                              className="mt-1 h-4 w-4 cursor-pointer accent-green-600" />
                          )}
                          {alreadySelected && isChosen && (
                            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">✓</span>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{quote.supplier.name}</p>
                            {quote.notes && <p className="mt-0.5 text-xs text-gray-500">{quote.notes}</p>}
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {quote.validez && <span>Válida hasta: {new Date(quote.validez).toLocaleDateString('es-CO')}</span>}
                              {quote.leadTime && <span>Entrega: {quote.leadTime}</span>}
                              <span>Recibida: {new Date(quote.createdAt).toLocaleDateString('es-CO')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xl font-bold ${isChosen ? 'text-green-700' : 'text-gray-900'}`}>
                            {formatCOP(Number(quote.total))}
                          </p>
                          <p className="text-xs text-gray-400">{quote.currency}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Ítems de la RQ */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Ítems a cotizar ({rq.items.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-6 py-3 text-left">Descripción</th>
                      <th className="px-6 py-3 text-left">Especificación</th>
                      <th className="px-6 py-3 text-right">Cant.</th>
                      <th className="px-6 py-3 text-left">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rq.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate">{item.spec || '—'}</td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">{item.qty}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{item.uom || 'unidad'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Checklist */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm">
              <p className="font-semibold uppercase tracking-widest text-blue-700 text-xs">Checklist del comprador</p>
              <ul className="mt-3 space-y-2 text-blue-900">
                {[
                  'Confirma que los proveedores recibieron la solicitud',
                  'Los precios incluyen impuestos y condiciones de entrega',
                  'Se tienen mínimo 2 cotizaciones para comparar',
                  'Selecciona el proveedor ganador y envía a autorización',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Available suppliers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Proveedores disponibles</p>
              {availableSuppliers.length === 0 ? (
                <p className="mt-3 text-xs text-gray-400">Todos los proveedores ya tienen cotización en esta RQ.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {availableSuppliers.map(s => (
                    <div key={s.id} className="rounded-xl border border-gray-100 p-3">
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email || 'Sin email'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Add quote modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="font-semibold text-gray-900">Agregar cotización</h3>
              </div>
              <form onSubmit={handleAddQuote} className="space-y-4 p-6">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Proveedor <span className="text-red-500">*</span></label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Selecciona un proveedor…</option>
                    {availableSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.nit ? ` · ${s.nit}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Total COP <span className="text-red-500">*</span></label>
                    <input type="text" value={total} onChange={e => setTotal(e.target.value)} required placeholder="Ej. 1500000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Válida hasta</label>
                    <input type="date" value={validez} onChange={e => setValidez(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Tiempo de entrega</label>
                  <input type="text" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="Ej. 5 días hábiles"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Condiciones, observaciones…"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setError('') }}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60">
                    {saving ? 'Guardando…' : 'Guardar cotización'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
