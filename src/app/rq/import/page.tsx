'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { importarRQ } from '../actions'
import Link from 'next/link'

type ParsedItem = {
  lineaProyecto: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
}

type ParsedData = {
  consecutivo: string
  fechaSolicitud: string
  procesCompra: string
  items: ParsedItem[]
}

type Project = {
  id: string
  code: string
  name: string
}

type CostCenter = {
  id: string
  code: string
  name: string
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-brand-magenta focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-magenta/20'

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

export default function ImportRQPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parsed, setParsed] = useState<ParsedData | null>(null)

  const [projectId, setProjectId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/catalogs', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? [])
        setCostCenters(d.costCenters ?? [])
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false))
  }, [])

  async function handleFileParse(f: File) {
    setParsing(true)
    setParseError('')
    setParsed(null)
    const form = new FormData()
    form.append('file', f)
    try {
      const res = await fetch('/api/rq/import/parse', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setParseError(data.error || 'Error al procesar el archivo')
        return
      }
      setParsed(data)
      // Auto-fill title from consecutivo or proceso
      setTitle(data.procesCompra || data.consecutivo || '')
      setDescription(
        [data.consecutivo && `Consecutivo: ${data.consecutivo}`, data.fechaSolicitud && `Fecha solicitud: ${data.fechaSolicitud}`]
          .filter(Boolean)
          .join(' · ')
      )
    } catch {
      setParseError('Error de conexión al procesar el archivo')
    } finally {
      setParsing(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    handleFileParse(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f) return
    setFile(f)
    handleFileParse(f)
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed || !projectId || !title.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const items = parsed.items.map((item) => ({
        name: item.descripcion,
        spec: item.lineaProyecto || '',
        qty: item.cantidad,
        uom: item.unidad || 'unidad',
        compraLocal: false,
        compraInternacional: false,
      }))

      const rq = await importarRQ({
        projectId,
        costCenterId: costCenterId || null,
        title,
        description,
        items,
      })

      router.push(`/rq/${rq.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear la RQ')
    } finally {
      setSubmitting(false)
    }
  }

  const fmtCOP = (v: number) =>
    v > 0 ? `$${v.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '—'

  const totalEstimado = parsed?.items.reduce(
    (acc, i) => acc + i.precioUnitario * i.cantidad, 0
  ) ?? 0

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-brand-purple to-brand-plum p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Importar desde Excel</p>
            <h1 className="mt-2 text-2xl font-bold">Nueva RQ por importación</h1>
            <p className="mt-1 text-sm text-white/70">
              Sube el archivo Excel de la requisición para crear automáticamente la RQ con sus ítems.
            </p>
          </div>
        </div>

        <Link
          href="/rq"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-magenta hover:text-brand-magentaDark transition"
        >
          ← Volver a Requisiciones
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* Left: upload + preview */}
          <div className="space-y-6">

            {/* Drop zone */}
            <div
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
                parsing
                  ? 'border-brand-magenta/40 bg-brand-magentaLight/20'
                  : parsed
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-brand-magenta/50 hover:bg-brand-magentaLight/10'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-magenta border-t-transparent" />
                  <p className="text-sm font-medium text-brand-magenta">Procesando archivo…</p>
                </div>
              ) : parsed ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-green-700">{file?.name}</p>
                  <p className="text-xs text-green-600">{parsed.items.length} ítems detectados</p>
                  <button
                    type="button"
                    onClick={() => { setParsed(null); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="mt-2 text-xs text-gray-400 underline hover:text-gray-600 transition"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Arrastra tu archivo Excel aquí</p>
                    <p className="mt-0.5 text-xs text-gray-400">o haz clic para seleccionar</p>
                  </div>
                  <label className="cursor-pointer rounded-xl border border-brand-magenta/30 bg-white px-4 py-2 text-sm font-medium text-brand-magenta shadow-sm transition hover:bg-brand-magentaLight">
                    Seleccionar archivo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-400">Formatos: .xlsx, .xls</p>
                </div>
              )}
            </div>

            {parseError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {parseError}
              </div>
            )}

            {/* Preview table */}
            {parsed && parsed.items.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <h2 className="font-semibold text-brand-plum">
                    Ítems detectados ({parsed.items.length})
                  </h2>
                  {totalEstimado > 0 && (
                    <span className="text-sm font-bold text-brand-magenta">
                      Total: {fmtCOP(totalEstimado)}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 text-left w-8">#</th>
                        <th className="px-4 py-3 text-left">Descripción</th>
                        <th className="px-4 py-3 text-left">Línea proyecto</th>
                        <th className="px-4 py-3 text-right">Cant.</th>
                        <th className="px-4 py-3 text-left">Unidad</th>
                        <th className="px-4 py-3 text-right">P. Unit</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsed.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-brand-magentaLight/10 transition">
                          <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 line-clamp-2 max-w-[220px] block">{item.descripcion}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px]">
                            <span className="line-clamp-1">{item.lineaProyecto || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm">
                            {item.cantidad.toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.unidad}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">
                            {fmtCOP(item.precioUnitario)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-brand-plum">
                            {fmtCOP(item.precioUnitario * item.cantidad)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {totalEstimado > 0 && (
                      <tfoot>
                        <tr className="border-t border-brand-magenta/20 bg-brand-magentaLight/30">
                          <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-brand-plum">
                            Total estimado
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-base font-bold text-brand-magenta">
                            {fmtCOP(totalEstimado)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="space-y-6">
            {/* Plantilla download */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">¿Sin plantilla?</p>
              <a
                href="/api/rq/import/template"
                download
                className="inline-flex items-center gap-2 rounded-xl border border-brand-magenta/30 bg-white px-4 py-2 text-sm font-medium text-brand-magenta transition hover:bg-brand-magentaLight"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar plantilla Excel
              </a>
            </div>

            {/* Confirmation form */}
            {parsed && (
              <form onSubmit={handleImport} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
                <h2 className="font-semibold text-brand-plum">Confirmar importación</h2>

                {/* Metadata from Excel */}
                {(parsed.consecutivo || parsed.fechaSolicitud || parsed.procesCompra) && (
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 space-y-1 text-xs text-gray-600">
                    {parsed.consecutivo && <p><strong>Consecutivo:</strong> {parsed.consecutivo}</p>}
                    {parsed.fechaSolicitud && <p><strong>Fecha solicitud:</strong> {parsed.fechaSolicitud}</p>}
                    {parsed.procesCompra && <p><strong>Proceso de compra:</strong> {parsed.procesCompra}</p>}
                  </div>
                )}

                <div>
                  <label className={labelCls}>Título de la RQ *</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título descriptivo de la requisición…"
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Proyecto *</label>
                  {catalogLoading ? (
                    <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                  ) : (
                    <select
                      className={inputCls}
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar proyecto…</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Centro de Costo</label>
                  {catalogLoading ? (
                    <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                  ) : (
                    <select
                      className={inputCls}
                      value={costCenterId}
                      onChange={(e) => setCostCenterId(e.target.value)}
                    >
                      <option value="">Sin centro de costo</option>
                      {costCenters.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                          [{cc.code}] {cc.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Descripción / Observaciones</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción adicional (opcional)…"
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !projectId || !title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-brand-purple py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importando…
                    </>
                  ) : (
                    `Importar ${parsed.items.length} ítems → Crear RQ`
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
