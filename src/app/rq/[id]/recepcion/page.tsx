'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { registrarRecepcion } from '../../actions'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
  searchParams: { role?: string }
}

type RQItemRow = {
  id: string
  name: string
  qty: string | number
  uom: string | null
  spec?: string | null
}

type ReceiptItemRow = {
  id: string
  rqItemId: string
  qtyReceived: string | number
  notes: string | null
  rqItem: { name: string; uom: string | null }
}

type Receipt = {
  id: string
  status: string
  notes: string | null
  createdAt: string
  items: ReceiptItemRow[]
}

type RQInfo = {
  code: string
  title: string
  status: string
}

type ItemQty = {
  rqItemId: string
  qtyReceived: string
  notes: string
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-brand-magenta focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-magenta/20'

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

export default function RecepcionPage({ params, searchParams }: PageProps) {
  const router = useRouter()
  const role = searchParams.role?.toUpperCase() || 'COMPRAS'

  const [rq, setRq] = useState<RQInfo | null>(null)
  const [rqItems, setRqItems] = useState<RQItemRow[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const [statusValue, setStatusValue] = useState<'CONFORME' | 'NO_CONFORME'>('CONFORME')
  const [notes, setNotes] = useState('')
  const [fechaRecepcion, setFechaRecepcion] = useState('')
  const [itemQtys, setItemQtys] = useState<ItemQty[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/rq/${params.id}/receipts`)
      .then((r) => r.json())
      .then((d) => {
        setRq(d.rq ?? null)
        setRqItems(d.rqItems ?? [])
        setReceipts(d.receipts ?? [])
        // Initialize item qty state from RQ items
        if (d.rqItems?.length) {
          setItemQtys(
            d.rqItems.map((item: RQItemRow) => ({
              rqItemId: item.id,
              qtyReceived: String(item.qty),
              notes: '',
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  function updateItemQty(rqItemId: string, field: 'qtyReceived' | 'notes', value: string) {
    setItemQtys((prev) =>
      prev.map((iq) => (iq.rqItemId === rqItemId ? { ...iq, [field]: value } : iq))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const items = itemQtys
        .filter((iq) => parseFloat(iq.qtyReceived) > 0)
        .map((iq) => ({
          rqItemId: iq.rqItemId,
          qtyReceived: parseFloat(iq.qtyReceived) || 0,
          notes: iq.notes || undefined,
        }))

      const result = await registrarRecepcion({
        rqId: params.id,
        status: statusValue,
        notes,
        fechaRecepcion,
        items,
      })
      setSuccess(
        statusValue === 'CONFORME'
          ? 'Recepción registrada. La RQ ha sido CERRADA exitosamente.'
          : 'Recepción registrada como NO CONFORME. La RQ permanece en recepción.'
      )
      setNotes('')
      if ((result as { newStatus?: string }).newStatus === 'CERRADA') {
        setTimeout(() => router.push(`/rq/${params.id}?role=${role}`), 2000)
      } else {
        fetch(`/api/rq/${params.id}/receipts`)
          .then((r) => r.json())
          .then((d) => setReceipts(d.receipts ?? []))
          .catch(() => {})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar recepción')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout currentRole={role}>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-brand-purple p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Recepción de bienes</p>
            <h1 className="mt-1.5 text-2xl font-bold">
              {loading ? '…' : rq?.code ?? params.id}
            </h1>
            {rq && (
              <p className="mt-1 text-sm text-white/75 line-clamp-1">{rq.title}</p>
            )}
          </div>
        </div>

        {/* Back */}
        <Link
          href={`/rq/${params.id}?role=${role}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-magenta hover:text-brand-magentaDark transition"
        >
          ← Volver al detalle de la RQ
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 font-semibold text-brand-plum">Registrar nueva recepción</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Fecha */}
                <div>
                  <label className={labelCls}>Fecha de recepción</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={fechaRecepcion}
                    onChange={(e) => setFechaRecepcion(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className={labelCls}>Estado de la recepción *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition ${
                        statusValue === 'CONFORME'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="CONFORME"
                        className="sr-only"
                        checked={statusValue === 'CONFORME'}
                        onChange={() => setStatusValue('CONFORME')}
                      />
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          statusValue === 'CONFORME' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {statusValue === 'CONFORME' && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-green-700">CONFORME</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-6">Bienes recibidos correctamente. Cerrará la RQ.</p>
                    </label>

                    <label
                      className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition ${
                        statusValue === 'NO_CONFORME'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="NO_CONFORME"
                        className="sr-only"
                        checked={statusValue === 'NO_CONFORME'}
                        onChange={() => setStatusValue('NO_CONFORME')}
                      />
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          statusValue === 'NO_CONFORME' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                        }`}>
                          {statusValue === 'NO_CONFORME' && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-red-700">NO CONFORME</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-6">Diferencias o faltantes. Se registra la incidencia.</p>
                    </label>
                  </div>
                </div>

                {/* Item-level receipt */}
                {rqItems.length > 0 && (
                  <div>
                    <label className={labelCls}>Cantidades recibidas por ítem</label>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            <th className="px-4 py-2.5 text-left">Ítem</th>
                            <th className="px-4 py-2.5 text-right">Solicitado</th>
                            <th className="px-4 py-2.5 text-right w-32">Recibido</th>
                            <th className="px-4 py-2.5 text-left w-48">Observación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rqItems.map((item) => {
                            const iq = itemQtys.find((q) => q.rqItemId === item.id)
                            return (
                              <tr key={item.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-2.5">
                                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-600">
                                  {Number(item.qty).toLocaleString('es-CO')} {item.uom || 'und'}
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={Number(item.qty)}
                                    value={iq?.qtyReceived ?? ''}
                                    onChange={(e) => updateItemQty(item.id, 'qtyReceived', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm font-mono focus:border-brand-magenta focus:outline-none focus:ring-1 focus:ring-brand-magenta/20"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    placeholder="Opcional…"
                                    value={iq?.notes ?? ''}
                                    onChange={(e) => updateItemQty(item.id, 'notes', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-brand-magenta focus:outline-none focus:ring-1 focus:ring-brand-magenta/20"
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={labelCls}>
                    Observaciones generales {statusValue === 'NO_CONFORME' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    placeholder={
                      statusValue === 'CONFORME'
                        ? 'Detalles adicionales de la recepción (opcional)…'
                        : 'Describe las diferencias, faltantes o daños encontrados…'
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required={statusValue === 'NO_CONFORME'}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-purple py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Registrando…
                    </>
                  ) : (
                    'Registrar recepción'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Previous receipts */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-brand-plum">
              Recepciones anteriores
              {receipts.length > 0 && (
                <span className="ml-2 rounded-full bg-brand-magentaLight px-2 py-0.5 text-xs text-brand-magenta">
                  {receipts.length}
                </span>
              )}
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-16" />
                ))}
              </div>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-gray-400">Aún no hay recepciones registradas.</p>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        receipt.status === 'CONFORME' ? 'bg-green-100 text-green-700' :
                        receipt.status === 'NO_CONFORME' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {receipt.status.replace('_', ' ')}
                      </span>
                    </div>
                    {receipt.notes && (
                      <p className="text-xs text-gray-600 mb-2">{receipt.notes}</p>
                    )}
                    {receipt.items.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-gray-50 pt-2">
                        {receipt.items.map((ri) => (
                          <div key={ri.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate max-w-[160px]">{ri.rqItem.name}</span>
                            <span className="font-mono text-gray-900 ml-2">
                              {Number(ri.qtyReceived).toLocaleString('es-CO')} {ri.rqItem.uom || 'und'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
