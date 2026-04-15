'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuoteItemData {
  id?: string
  rqItemId?: string | null
  uom?: string
  qty: number
  price: number
  specNote?: string
}

interface QuoteData {
  id: string
  supplierId: string
  supplier: { id: string; name: string }
  total: number
  currency: string
  validez?: string | null
  leadTime?: string | null
  notes?: string | null
  items: QuoteItemData[]
}

interface RQItemData {
  id: string
  name: string
  spec?: string | null  // used as lineaProyecto
  qty: number
  uom?: string | null
}

interface RQData {
  id: string
  code: string
  title: string
  status: string
  items: RQItemData[]
  quotes: QuoteData[]
  comparison?: { chosenId?: string | null }
}

interface SupplierOption {
  id: string
  name: string
  nit?: string
}

interface ModalItemRow {
  rqItemId: string
  uom: string
  qty: string
  price: string
  specNote: string
}

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

// ── Main component ─────────────────────────────────────────────────────────────

export default function QuotesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'COMPRAS'

  const [rq, setRq] = useState<RQData | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null)
  const [savingWinner, setSavingWinner] = useState(false)
  const [error, setError] = useState('')

  // Comparison file upload
  const [uploadingFile, setUploadingFile] = useState(false)
  const [comparativeFileUrl, setComparativeFileUrl] = useState<string | null>(null)

  // Modal state
  const [modalSupplierId, setModalSupplierId] = useState('')
  const [modalCurrency, setModalCurrency] = useState('COP')
  const [modalNotes, setModalNotes] = useState('')
  const [modalValidez, setModalValidez] = useState('')
  const [modalLeadTime, setModalLeadTime] = useState('')
  const [modalRows, setModalRows] = useState<ModalItemRow[]>([])
  const [savingQuote, setSavingQuote] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    fetch(`/api/rq/${params.id}/quotes`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setRq(d.rq)
        setSuppliers(d.suppliers)
        if (d.rq.comparison?.chosenId) setSelectedWinnerId(d.rq.comparison.chosenId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checklist = d.rq.comparison?.checklist as any
        if (checklist?.comparisonFileUrl) setComparativeFileUrl(checklist.comparisonFileUrl)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { loadData() }, [loadData])

  const availableSuppliers = suppliers.filter(
    s => !rq?.quotes.some(q => q.supplierId === s.id)
  )

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('rqId', params.id)
      const res = await fetch(`/api/rq/${params.id}/comparison-file`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) setComparativeFileUrl(data.url)
    } catch { /* silent */ }
    finally { setUploadingFile(false) }
  }

  function openModal() {
    if (!rq) return
    setModalSupplierId('')
    setModalCurrency('COP')
    setModalNotes('')
    setModalValidez('')
    setModalLeadTime('')
    setModalRows(rq.items.map(item => ({
      rqItemId: item.id,
      uom: item.uom || '',
      qty: String(item.qty),
      price: '',
      specNote: '',
    })))
    setModalError('')
    setShowModal(true)
  }

  function updateModalRow(idx: number, field: keyof ModalItemRow, value: string) {
    setModalRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const modalTotal = modalRows.reduce((sum, row) => {
    return sum + (parseFloat(row.qty) || 0) * (parseFloat(row.price) || 0)
  }, 0)

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault()
    if (!modalSupplierId) { setModalError('Selecciona un proveedor'); return }
    if (modalTotal === 0) { setModalError('Ingresa al menos un precio'); return }
    setSavingQuote(true)
    setModalError('')
    try {
      const items = modalRows
        .filter(r => parseFloat(r.price) > 0 || parseFloat(r.qty) > 0)
        .map(r => ({
          rqItemId: r.rqItemId,
          uom: r.uom || null,
          qty: parseFloat(r.qty) || 0,
          price: parseFloat(r.price) || 0,
          specNote: r.specNote || null,
        }))

      const res = await fetch(`/api/rq/${params.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: modalSupplierId,
          currency: modalCurrency,
          validez: modalValidez || undefined,
          leadTime: modalLeadTime || undefined,
          notes: modalNotes || undefined,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setModalError(data.error || 'Error al guardar'); return }
      setShowModal(false)
      loadData()
    } catch {
      setModalError('Error de conexión')
    } finally {
      setSavingQuote(false)
    }
  }

  async function confirmWinner() {
    if (!selectedWinnerId) { setError('Selecciona el proveedor ganador'); return }
    if (!rq || rq.quotes.length < 2) { setError('Se necesitan al menos 2 cotizaciones'); return }
    setSavingWinner(true)
    setError('')
    try {
      const res = await fetch(`/api/rq/${params.id}/comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chosenSupplierId: selectedWinnerId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); return }
      router.push(`/rq/${params.id}?role=${role}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setSavingWinner(false)
    }
  }

  const canSendToAuth = rq && rq.quotes.length >= 2 && selectedWinnerId && rq.status === 'EN_COMPARATIVO'
  const readonly = !['EN_COMPARATIVO', 'ENVIADA_COMPRAS'].includes(rq?.status ?? '')

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Comparativo de Cotizaciones</p>
              <h1 className="mt-2 text-2xl font-bold">{loading ? '…' : rq?.code ?? params.id}</h1>
              {rq && <p className="mt-1 text-sm text-white/75 line-clamp-1">{rq.title}</p>}
            </div>
            {!loading && (
              <div className="flex flex-shrink-0 flex-wrap gap-2">
                {!readonly && availableSuppliers.length > 0 && (
                  <button onClick={openModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar cotización
                  </button>
                )}
                <Link href={`/rq/${params.id}/email-suppliers?role=${role}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar correo
                </Link>
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/rq/${params.id}?role=${role}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
        >
          ← Volver al detalle de la RQ
        </Link>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400">Cargando comparativo…</div>
        ) : !rq ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
            Requisición no encontrada.
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              {[
                { label: 'Mínimo 1 cotización', done: rq.quotes.length >= 1 },
                { label: 'Mínimo 2 cotizaciones', done: rq.quotes.length >= 2 },
                { label: 'Proveedor seleccionado', done: !!selectedWinnerId },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-px w-6 ${step.done ? 'bg-indigo-300' : 'bg-gray-200'}`} />}
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${step.done ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                    {step.done ? '✓' : '○'} {step.label}
                  </span>
                </div>
              ))}
              <span className="ml-auto text-sm text-gray-500">
                {rq.quotes.length} proveedor{rq.quotes.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Matrix table */}
            {rq.quotes.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center">
                <p className="text-sm font-medium text-gray-500">Aún no hay cotizaciones registradas</p>
                <p className="mt-1 text-xs text-gray-400">Usa &quot;Agregar cotización&quot; para ingresar la información recibida de cada proveedor</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    {/* Row 1: supplier group headers */}
                    <tr className="border-b border-gray-200 bg-slate-700 text-white">
                      <th colSpan={4} className="border-r border-slate-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Detalle / Comparación
                      </th>
                      {rq.quotes.map(q => (
                        <th
                          key={q.id}
                          colSpan={5}
                          className={`border-r border-slate-600 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${selectedWinnerId === q.supplierId ? 'bg-emerald-700' : ''}`}
                        >
                          {q.supplier.name}
                          {selectedWinnerId === q.supplierId && (
                            <span className="ml-1.5 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] text-emerald-900">✓ Ganador</span>
                          )}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: column labels */}
                    <tr className="border-b-2 border-gray-300 bg-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="w-20 px-3 py-2.5 text-left">Línea</th>
                      <th className="min-w-[220px] px-3 py-2.5 text-left">Descripción</th>
                      <th className="px-3 py-2.5 text-left">Present.</th>
                      <th className="border-r border-gray-300 px-3 py-2.5 text-right">Cant. Req.</th>
                      {rq.quotes.map(q => (
                        <>
                          <th key={`${q.id}-uom`} className="px-2 py-2.5 text-center">Unidad</th>
                          <th key={`${q.id}-qty`} className="px-2 py-2.5 text-right">Cant.</th>
                          <th key={`${q.id}-pu`} className="px-2 py-2.5 text-right">P. Unitario</th>
                          <th key={`${q.id}-pt`} className="px-2 py-2.5 text-right">P. Total</th>
                          <th key={`${q.id}-nov`} className="border-r border-gray-300 min-w-[130px] px-2 py-2.5 text-left">Novedad</th>
                        </>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {rq.items.map((item, rowIdx) => (
                      <tr key={item.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{item.spec || '—'}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{item.name}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{item.uom || '—'}</td>
                        <td className="border-r border-gray-200 px-3 py-2.5 text-right font-mono font-bold text-gray-700">{Number(item.qty)}</td>
                        {rq.quotes.map(q => {
                          const qi = q.items.find(i => i.rqItemId === item.id)
                          const rowTotal = qi ? Number(qi.price) * Number(qi.qty) : null
                          const isWinner = selectedWinnerId === q.supplierId
                          return (
                            <>
                              <td key={`${q.id}-uom`} className={`px-2 py-2.5 text-center text-xs text-gray-500 ${isWinner ? 'bg-emerald-50' : ''}`}>{qi?.uom || '—'}</td>
                              <td key={`${q.id}-qty`} className={`px-2 py-2.5 text-right font-mono text-xs ${isWinner ? 'bg-emerald-50' : ''}`}>{qi ? Number(qi.qty) : '—'}</td>
                              <td key={`${q.id}-pu`} className={`px-2 py-2.5 text-right font-mono text-xs ${isWinner ? 'bg-emerald-50' : ''}`}>
                                {qi ? formatCOP(Number(qi.price)) : '—'}
                              </td>
                              <td key={`${q.id}-pt`} className={`px-2 py-2.5 text-right font-mono text-xs font-semibold ${isWinner ? 'bg-yellow-100 text-emerald-800' : rowTotal ? 'text-gray-800' : 'text-gray-300'}`}>
                                {rowTotal != null ? formatCOP(rowTotal) : '—'}
                              </td>
                              <td key={`${q.id}-nov`} className={`border-r border-gray-200 px-2 py-2.5 text-xs italic ${isWinner ? 'bg-emerald-50 text-emerald-700' : 'text-red-500'}`}>
                                {qi?.specNote || ''}
                              </td>
                            </>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    {/* Totals */}
                    <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                      <td colSpan={4} className="border-r border-gray-300 px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                        Total
                      </td>
                      {rq.quotes.map(q => {
                        const isWinner = selectedWinnerId === q.supplierId
                        return (
                          <>
                            <td key={`${q.id}-f1`} colSpan={3} className={isWinner ? 'bg-emerald-100' : ''} />
                            <td key={`${q.id}-tot`} className={`px-2 py-3 text-right font-mono text-base font-bold ${isWinner ? 'bg-yellow-200 text-emerald-900' : 'text-gray-800'}`}>
                              <span className="text-xs font-normal opacity-60">{q.currency} </span>
                              {formatCOP(Number(q.total))}
                            </td>
                            <td key={`${q.id}-f2`} className={`border-r border-gray-300 ${isWinner ? 'bg-emerald-100' : ''}`} />
                          </>
                        )
                      })}
                    </tr>

                    {/* Winner selection */}
                    {!readonly && (
                      <tr className="bg-white">
                        <td colSpan={4} className="border-r border-gray-200 px-3 py-3 text-right text-xs text-gray-400 italic">
                          Seleccionar ganador →
                        </td>
                        {rq.quotes.map(q => (
                          <>
                            <td key={`${q.id}-sel`} colSpan={4} className="px-2 py-3 text-center">
                              <button
                                onClick={() => setSelectedWinnerId(q.supplierId)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  selectedWinnerId === q.supplierId
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                                }`}
                              >
                                {selectedWinnerId === q.supplierId ? '✓ Seleccionado' : 'Seleccionar'}
                              </button>
                            </td>
                            <td key={`${q.id}-selsp`} className="border-r border-gray-200" />
                          </>
                        ))}
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}

            {/* Comparison file upload / download */}
            {!readonly && (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-5 py-3">
                <svg className="h-5 w-5 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-semibold text-indigo-700">Cuadro comparativo (Excel)</span>
                {comparativeFileUrl ? (
                  <a href={comparativeFileUrl} target="_blank" rel="noreferrer"
                    className="ml-auto rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition">
                    Ver archivo ↗
                  </a>
                ) : (
                  <span className="ml-auto text-xs text-indigo-400">No hay archivo adjunto</span>
                )}
                <label className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${uploadingFile ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {uploadingFile ? 'Subiendo…' : comparativeFileUrl ? 'Reemplazar' : 'Subir Excel'}
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={uploadingFile} onChange={handleFileUpload} />
                </label>
              </div>
            )}
            {!readonly && comparativeFileUrl && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <span className="text-xs text-emerald-700">✓ Archivo comparativo adjunto</span>
                <a href={comparativeFileUrl} target="_blank" rel="noreferrer"
                  className="text-xs font-semibold text-emerald-700 underline underline-offset-2">Descargar</a>
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center justify-between gap-4">
              <div>
                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
                )}
              </div>
              {!readonly && (
                <button
                  onClick={confirmWinner}
                  disabled={!canSendToAuth || savingWinner}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingWinner && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Enviar a Autorización →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────────── */}
      {showModal && rq && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-white">Registrar cotización de proveedor</h2>
                <p className="text-xs text-white/70">Ingresa la información recibida por correo o teléfono</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={submitQuote} className="p-6">
              {/* Supplier + metadata */}
              <div className="mb-5 grid gap-4 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Proveedor *</label>
                  <select
                    value={modalSupplierId}
                    onChange={e => setModalSupplierId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  >
                    <option value="">Seleccionar proveedor…</option>
                    {availableSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.nit ? ` — NIT ${s.nit}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Moneda</label>
                  <select value={modalCurrency} onChange={e => setModalCurrency(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20">
                    <option value="COP">COP — Peso colombiano</option>
                    <option value="USD">USD — Dólar estadounidense</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Validez cotización</label>
                  <input type="date" value={modalValidez} onChange={e => setModalValidez(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lead time entrega</label>
                  <input type="text" value={modalLeadTime} onChange={e => setModalLeadTime(e.target.value)}
                    placeholder="Ej. 5 días hábiles"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none" />
                </div>
              </div>

              {/* Items */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-3 py-2.5 text-left">Línea</th>
                      <th className="min-w-[200px] px-3 py-2.5 text-left">Descripción solicitada</th>
                      <th className="px-3 py-2.5 text-center">Cant. Req.</th>
                      <th className="px-3 py-2.5 text-left">Unidad ofrecida</th>
                      <th className="px-3 py-2.5 text-right">Cantidad</th>
                      <th className="px-3 py-2.5 text-right">P. Unitario ({modalCurrency})</th>
                      <th className="px-3 py-2.5 text-right">Precio Total</th>
                      <th className="min-w-[150px] px-3 py-2.5 text-left">Novedad / Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rq.items.map((item, idx) => {
                      const row = modalRows[idx]
                      if (!row) return null
                      const qty = parseFloat(row.qty) || 0
                      const price = parseFloat(row.price) || 0
                      const rowTotal = qty * price
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-3 py-2 font-mono text-xs text-gray-400">{item.spec || '—'}</td>
                          <td className="px-3 py-2 text-gray-800">{item.name}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-gray-600">{Number(item.qty)}</td>
                          <td className="px-3 py-2">
                            <input type="text" value={row.uom} onChange={e => updateModalRow(idx, 'uom', e.target.value)}
                              placeholder={item.uom || 'unidad'}
                              className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateModalRow(idx, 'qty', e.target.value)}
                              className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="1" value={row.price} onChange={e => updateModalRow(idx, 'price', e.target.value)}
                              placeholder="0"
                              className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none" />
                          </td>
                          <td className={`px-3 py-2 text-right font-mono text-xs font-semibold ${rowTotal > 0 ? 'text-indigo-700' : 'text-gray-300'}`}>
                            {rowTotal > 0 ? formatCOP(rowTotal) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" value={row.specNote} onChange={e => updateModalRow(idx, 'specNote', e.target.value)}
                              placeholder="Ej. Marca Biosystem…"
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-indigo-200 bg-indigo-50">
                      <td colSpan={6} className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-indigo-700">Total cotización</td>
                      <td className="px-3 py-3 text-right font-mono text-base font-bold text-indigo-900">{formatCOP(modalTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones generales</label>
                <textarea value={modalNotes} onChange={e => setModalNotes(e.target.value)} rows={2}
                  placeholder="Condiciones de pago, descuentos, garantías, condiciones de entrega…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20" />
              </div>

              {modalError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{modalError}</div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={savingQuote || modalTotal === 0}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60">
                  {savingQuote && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Guardar cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
