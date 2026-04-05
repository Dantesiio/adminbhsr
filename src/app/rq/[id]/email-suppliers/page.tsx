'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface RQItem {
  id: string
  name: string
  spec?: string | null
  qty: number
  uom?: string | null
}

interface RQData {
  id: string
  code: string
  title: string
  description?: string | null
  project: { name: string }
  items: RQItem[]
}

interface SupplierOption {
  id: string
  name: string
  email?: string | null
  nit?: string | null
}

type SendResult = { supplier: string; status: 'sent' | 'no-email' | 'error'; error?: string }

export default function EmailSuppliersPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'COMPRAS'

  const [rq, setRq] = useState<RQData | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deadline, setDeadline] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResult[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/rq/${params.id}/email-suppliers`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.json()
      })
      .then(d => { if (d) { setRq(d.rq); setSuppliers(d.suppliers) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  function toggleSupplier(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === suppliersWithEmail.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(suppliersWithEmail.map(s => s.id)))
    }
  }

  async function handleSend() {
    if (selected.size === 0) { setError('Selecciona al menos un proveedor'); return }
    setSending(true)
    setError('')
    setResults(null)
    try {
      const res = await fetch(`/api/rq/${params.id}/email-suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierIds: Array.from(selected),
          deadline: deadline || undefined,
          customMessage: customMessage || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar'); return }
      setResults(data.results)
    } catch {
      setError('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  const suppliersWithEmail = suppliers.filter(s => s.email)
  const suppliersWithoutEmail = suppliers.filter(s => !s.email)

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Solicitud de Cotización por Correo</p>
            <h1 className="mt-2 text-2xl font-bold">{loading ? '…' : rq?.code}</h1>
            {rq && <p className="mt-1 text-sm text-white/75 line-clamp-1">{rq.title}</p>}
          </div>
        </div>

        <Link href={`/rq/${params.id}?role=${role}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 transition">
          ← Volver al detalle de la RQ
        </Link>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400">Cargando…</div>
        ) : !rq ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">RQ no encontrada.</div>
        ) : results ? (
          /* ── Results view ── */
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">Resultado del envío</h2>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  r.status === 'sent' ? 'border-green-200 bg-green-50' :
                  r.status === 'no-email' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <span className="text-sm font-medium text-gray-800">{r.supplier}</span>
                  <span className={`text-xs font-semibold ${
                    r.status === 'sent' ? 'text-green-700' :
                    r.status === 'no-email' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {r.status === 'sent' ? '✓ Enviado' :
                     r.status === 'no-email' ? '⚠ Sin correo registrado' :
                     '✗ Error al enviar'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setResults(null)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Enviar a más proveedores
              </button>
              <Link href={`/rq/${params.id}?role=${role}`}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
                Volver a la RQ
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* Left: supplier selection */}
            <div className="space-y-6">

              {/* RQ summary */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Ítems que se solicitarán ({rq.items.length})</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <th className="px-3 py-2.5 text-left">Línea</th>
                        <th className="px-3 py-2.5 text-left">Descripción</th>
                        <th className="px-3 py-2.5 text-center">Unidad</th>
                        <th className="px-3 py-2.5 text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rq.items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs text-gray-400">{item.spec || '—'}</td>
                          <td className="px-3 py-2 text-gray-800">{item.name}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{item.uom || '—'}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-gray-700">{Number(item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier selection */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Seleccionar proveedores</h2>
                  {suppliersWithEmail.length > 0 && (
                    <button onClick={toggleAll} className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition">
                      {selected.size === suppliersWithEmail.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>

                {suppliersWithEmail.length === 0 && suppliersWithoutEmail.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay proveedores registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {suppliersWithEmail.map(s => (
                      <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected.has(s.id) ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSupplier(s.id)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}{s.nit ? ` · NIT ${s.nit}` : ''}</p>
                        </div>
                      </label>
                    ))}
                    {suppliersWithoutEmail.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Sin correo registrado (no se pueden enviar)</p>
                        {suppliersWithoutEmail.map(s => (
                          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 p-3 opacity-50">
                            <div className="h-4 w-4 rounded border border-gray-300" />
                            <div>
                              <p className="text-sm text-gray-500">{s.name}</p>
                              <Link href={`/suppliers/${s.id}/edit`} className="text-xs text-purple-500 hover:underline">
                                Agregar correo →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: email config */}
            <div className="space-y-5">

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Configurar correo</h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Fecha límite para cotizar
                    </label>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mensaje adicional (opcional)
                    </label>
                    <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={4}
                      placeholder="Condiciones especiales, instrucciones de entrega, contacto…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                <p className="text-sm font-semibold text-purple-800">
                  Se enviará a {selected.size} proveedor{selected.size !== 1 ? 'es' : ''}
                </p>
                <p className="mt-1 text-xs text-purple-600">
                  El correo incluirá todos los ítems de la RQ con sus cantidades y unidades.
                </p>
                {selected.size > 0 && (
                  <ul className="mt-3 space-y-1">
                    {Array.from(selected).map(id => {
                      const s = suppliers.find(x => x.id === id)
                      return s ? (
                        <li key={id} className="text-xs text-purple-700">• {s.name} ({s.email})</li>
                      ) : null
                    })}
                  </ul>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
              )}

              <button onClick={handleSend} disabled={sending || selected.size === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Enviando…</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg> Enviar solicitud de cotización</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
