'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRQ } from '../actions'
import type { CreateRQInput } from '../actions'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional(),   // lineaProyecto
  qty: z.number().positive('Debe ser > 0'),
  uom: z.string().optional(),
})

const RQSchema = z.object({
  projectId: z.string().min(1, 'Selecciona un proyecto'),
  costCenterId: z.string().optional(),
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})

type RQForm = z.infer<typeof RQSchema>

// ─── Excel import types ───────────────────────────────────────────────────────

type ParsedExcelItem = {
  lineaProyecto: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
}

type ExcelPreview = {
  consecutivo: string
  fechaSolicitud: string
  procesCompra: string
  items: ParsedExcelItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

// ─── Field input styled ───────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-brand-magenta focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-magenta/20'

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewRQPage() {
  const router = useRouter()
  const form = useForm<RQForm>({
    resolver: zodResolver(RQSchema),
    defaultValues: { items: [{ name: '', spec: '', qty: 1, uom: 'unidad' }] },
  })
  const { fields, append, remove, replace } = useFieldArray({ name: 'items', control: form.control })

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [costCenters, setCostCenters] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Excel import state
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [preview, setPreview] = useState<ExcelPreview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/catalogs')
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || [])
        setCostCenters(d.costCenters || [])
      })
      .catch(() => {})
  }, [])

  const watchedItems = useWatch({ control: form.control, name: 'items' })

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function onSubmit(values: RQForm) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const input: CreateRQInput = {
        projectId: values.projectId,
        costCenterId: values.costCenterId || undefined,
        title: values.title,
        description: values.description || '',
        items: values.items.map((item) => ({
          name: item.name,
          spec: item.spec || '',
          qty: Number(item.qty),
          uom: item.uom || 'unidad',
        })),
      }
      const rq = await createRQ(input)
      router.push(`/rq/${rq.id}?role=SOLICITANTE`)
    } catch (err) {
      setSubmitError('Error al crear la requisición. Intenta de nuevo.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Excel parsing ────────────────────────────────────────────────────────

  const parseExcelFile = useCallback(async (file: File) => {
    setParsing(true)
    setParseError('')
    setPreview(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/rq/import/parse', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al parsear el archivo')
      setPreview(json)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setParsing(false)
    }
  }, [])

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseExcelFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseExcelFile(file)
  }

  function applyPreview() {
    if (!preview) return
    replace(
      preview.items.map((item) => ({
        name: item.descripcion,
        spec: item.lineaProyecto ? `Línea: ${item.lineaProyecto}` : '',
        qty: item.cantidad,
        uom: item.unidad || 'unidad',
        unitPrice: item.precioUnitario,
      }))
    )
    if (preview.consecutivo) {
      form.setValue('title', `RQ ${preview.consecutivo} — Importada desde Excel`)
    }
    setShowImport(false)
    setPreview(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout currentRole="SOLICITANTE">
      <div className="space-y-6">

        {/* ── Header card ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-magenta via-brand-magentaDark to-brand-purple p-7 text-white shadow-xl shadow-brand-magenta/25">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Solicitante</p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight">Crear nueva requisición</h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/75">
                Completa la información del proyecto y los ítems. También puedes importar desde Excel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Excel
            </button>
          </div>
        </div>

        {/* ── Excel import panel ── */}
        {showImport && (
          <div className="rounded-2xl border border-brand-magenta/20 bg-brand-magentaLight/30 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-brand-plum">Importar desde Excel</h3>
              <div className="flex gap-2">
                <a
                  href="/api/rq/import/template"
                  download
                  className="rounded-lg border border-brand-magenta/30 px-3 py-1.5 text-xs font-semibold text-brand-magenta hover:bg-brand-magentaLight transition"
                >
                  ↓ Descargar plantilla
                </a>
                <button
                  type="button"
                  onClick={() => { setShowImport(false); setPreview(null); setParseError('') }}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Drag & Drop zone */}
            {!preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition ${
                  dragOver
                    ? 'border-brand-magenta bg-brand-magentaLight'
                    : 'border-brand-magenta/30 hover:border-brand-magenta hover:bg-brand-magentaLight/50'
                }`}
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-magenta border-t-transparent" />
                    <p className="text-sm font-medium text-brand-plum">Analizando archivo…</p>
                  </div>
                ) : (
                  <>
                    <svg className="h-10 w-10 text-brand-magenta/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-3 text-sm font-semibold text-brand-plum">
                      Arrastra tu Excel aquí o haz clic para seleccionar
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Acepta .xlsx y .xls</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {parseError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {parseError}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/70 p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Consecutivo</p>
                    <p className="font-semibold text-brand-plum">{preview.consecutivo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fecha solicitud</p>
                    <p className="font-semibold text-brand-plum">{preview.fechaSolicitud || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Proceso de compra</p>
                    <p className="font-semibold text-brand-plum">{preview.procesCompra || '—'}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 text-left">Línea proyecto</th>
                        <th className="px-4 py-3 text-left">Descripción</th>
                        <th className="px-4 py-3 text-left">Unidad</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Precio Unit COP</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.items.map((item, i) => (
                        <tr key={i} className="hover:bg-brand-magentaLight/20">
                          <td className="px-4 py-2.5 text-gray-500">{item.lineaProyecto || '—'}</td>
                          <td className="px-4 py-2.5 max-w-xs">
                            <span className="line-clamp-2 text-gray-800">{item.descripcion}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{item.unidad || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{item.cantidad}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCOP(item.precioUnitario)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-brand-plum font-semibold">
                            {formatCOP(item.cantidad * item.precioUnitario)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-brand-magentaLight/30">
                        <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-brand-plum">
                          Total estimado
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-brand-magenta">
                          {formatCOP(preview.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={applyPreview}
                    className="flex-1 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                  >
                    ✓ Confirmar importación ({preview.items.length} ítems)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setParseError('') }}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Main form ── */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Info general */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-brand-plum">Información general</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Proyecto *</label>
                <select className={inputCls} {...form.register('projectId')}>
                  <option value="">Selecciona un proyecto…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {form.formState.errors.projectId && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.projectId.message}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Centro de Costo</label>
                <select className={inputCls} {...form.register('costCenterId')}>
                  <option value="">Seleccionar…</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Título de la requisición *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. Compra de bolsas para quirófano — Junio 2025"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Descripción general</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  placeholder="Contexto de la solicitud, urgencia, condiciones especiales…"
                  {...form.register('description')}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-plum">
                Ítems de la requisición
                <span className="ml-2 rounded-full bg-brand-magentaLight px-2 py-0.5 text-xs font-semibold text-brand-magenta">
                  {fields.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => append({ name: '', spec: '', qty: 1, uom: 'unidad' })}
                className="flex items-center gap-1.5 rounded-xl border border-brand-magenta/30 px-3 py-2 text-xs font-semibold text-brand-magenta transition hover:bg-brand-magentaLight"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar ítem
              </button>
            </div>

            {/* Table header */}
            <div className="mb-2 hidden grid-cols-[2fr_1fr_80px_90px_40px] gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid">
              <span>Descripción *</span>
              <span>Línea de Proyecto</span>
              <span>Unidad</span>
              <span className="text-right">Cantidad</span>
              <span />
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => {
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-[2fr_1fr_80px_90px_40px] sm:items-center sm:bg-transparent sm:border-0 sm:p-0"
                  >
                    {/* Name */}
                    <div>
                      <label className="mb-1 block text-xs text-gray-400 sm:hidden">Descripción *</label>
                      <input
                        className={inputCls}
                        placeholder="Descripción del producto o servicio"
                        {...form.register(`items.${idx}.name`)}
                      />
                      {form.formState.errors.items?.[idx]?.name && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.items[idx]?.name?.message}</p>
                      )}
                    </div>

                    {/* Línea de Proyecto */}
                    <div>
                      <label className="mb-1 block text-xs text-gray-400 sm:hidden">Línea de Proyecto</label>
                      <input
                        className={inputCls}
                        placeholder="Ej. 1.2.4"
                        {...form.register(`items.${idx}.spec`)}
                      />
                    </div>

                    {/* UOM */}
                    <div>
                      <label className="mb-1 block text-xs text-gray-400 sm:hidden">Unidad</label>
                      <input
                        className={inputCls}
                        placeholder="unidad"
                        {...form.register(`items.${idx}.uom`)}
                      />
                    </div>

                    {/* Qty */}
                    <div>
                      <label className="mb-1 block text-xs text-gray-400 sm:hidden">Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={`${inputCls} text-right`}
                        {...form.register(`items.${idx}.qty`, { valueAsNumber: true })}
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex justify-end sm:justify-center">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                        className="rounded-lg border border-red-200 p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {form.formState.errors.items?.message && (
              <p className="mt-3 text-sm text-red-600">{form.formState.errors.items.message}</p>
            )}

          </div>

          {/* Actions */}
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard?role=SOLICITANTE')}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-magenta/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creando…
                </>
              ) : (
                'Crear Requisición'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
