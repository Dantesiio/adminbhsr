'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateRQ } from '../actions'
import type { UpdateRQInput } from '../actions'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'

// ─── Schema ───────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional(),
  descripcion: z.string().optional(),
  comentario: z.string().optional(),
  qty: z.number().positive('Debe ser > 0'),
  uom: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  compraLocal: z.boolean().optional().default(false),
  compraInternacional: z.boolean().optional().default(false),
})

const RQSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  consecutivo: z.string().optional(),
  direccionEntrega: z.string().optional(),
  moneda: z.string().default('COP'),
  financiador: z.string().optional(),
  euroRate: z.number().positive().optional(),
  usdRate: z.number().positive().optional(),
  ivaRate: z.number().min(0).max(100).default(0),
  fechaEntregaDeseada: z.string().optional(),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})

type RQForm = z.infer<typeof RQSchema>

// ─── Types ────────────────────────────────────────────────────────────────────

interface RQData {
  id: string
  code: string
  title: string
  description: string
  consecutivo: string
  direccionEntrega: string
  moneda: string
  financiador: string
  euroRate?: number
  usdRate?: number
  ivaRate: number
  fechaEntregaDeseada: string
  projectId: string
  projectName: string
  costCenterId: string
  items: { name: string; spec: string; descripcion: string; comentario: string; qty: number; uom: string; unitPrice: number; compraLocal: boolean; compraInternacional: boolean }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-brand-magenta focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-magenta/20'

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditRQForm({ rq }: { rq: RQData }) {
  const router = useRouter()
  const form = useForm<RQForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(RQSchema) as any,
    defaultValues: {
      title: rq.title,
      description: rq.description,
      consecutivo: rq.consecutivo,
      direccionEntrega: rq.direccionEntrega,
      moneda: rq.moneda,
      financiador: rq.financiador,
      euroRate: rq.euroRate,
      usdRate: rq.usdRate,
      ivaRate: rq.ivaRate,
      fechaEntregaDeseada: rq.fechaEntregaDeseada,
      items: rq.items,
    },
  })
  const { fields, append, remove } = useFieldArray({ name: 'items', control: form.control })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function onSubmit(values: RQForm) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const input: UpdateRQInput = {
        title: values.title,
        description: values.description || '',
        consecutivo: values.consecutivo || '',
        direccionEntrega: values.direccionEntrega || '',
        moneda: values.moneda || 'COP',
        financiador: values.financiador || '',
        euroRate: values.euroRate || undefined,
        usdRate: values.usdRate || undefined,
        ivaRate: values.ivaRate ?? 0,
        fechaEntregaDeseada: values.fechaEntregaDeseada || undefined,
        items: values.items.map((item) => ({
          name: item.name,
          spec: item.spec || '',
          descripcion: item.descripcion || '',
          comentario: item.comentario || '',
          qty: Number(item.qty),
          uom: item.uom || 'unidad',
          precioEstimado: item.unitPrice || undefined,
          compraLocal: item.compraLocal ?? false,
          compraInternacional: item.compraInternacional ?? false,
        })),
      }
      await updateRQ(rq.id, input)
    } catch (err) {
      setSubmitError('Error al guardar los cambios. Intenta de nuevo.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout currentRole="SOLICITANTE">
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-7 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Editar Requisición</p>
            <h1 className="mt-1.5 text-2xl font-bold leading-tight">{rq.code}</h1>
            <p className="mt-1 text-sm text-white/75">Proyecto: {rq.projectName}</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Info general */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-brand-plum">Información general</h2>
            <div className="grid gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label className={labelCls}>Título de la requisición *</label>
                <input type="text" className={inputCls} {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Comentarios</label>
                <textarea className={inputCls} rows={3} {...form.register('description')} />
              </div>

              <div>
                <label className={labelCls}>Consecutivo</label>
                <input type="text" className={inputCls} {...form.register('consecutivo')} />
              </div>

              <div>
                <label className={labelCls}>Moneda</label>
                <select className={inputCls} {...form.register('moneda')}>
                  <option value="COP">COP — Peso colombiano</option>
                  <option value="USD">USD — Dólar estadounidense</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Financiador</label>
                <input type="text" className={inputCls} {...form.register('financiador')} />
              </div>

              <div>
                <label className={labelCls}>TRM Euro (COP)</label>
                <input type="number" step="0.01" className={inputCls} {...form.register('euroRate', { valueAsNumber: true })} />
              </div>

              <div>
                <label className={labelCls}>TRM USD (COP)</label>
                <input type="number" step="0.01" className={inputCls} {...form.register('usdRate', { valueAsNumber: true })} />
              </div>

              <div>
                <label className={labelCls}>IVA aplicable</label>
                <select className={inputCls} {...form.register('ivaRate', { valueAsNumber: true })}>
                  <option value={0}>Sin IVA (0%)</option>
                  <option value={5}>IVA 5%</option>
                  <option value={19}>IVA 19%</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Fecha de entrega deseada</label>
                <input type="date" className={inputCls} {...form.register('fechaEntregaDeseada')} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Dirección de entrega</label>
                <input type="text" className={inputCls} {...form.register('direccionEntrega')} />
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
                onClick={() => append({ name: '', spec: '', descripcion: '', comentario: '', qty: 1, uom: 'unidad', unitPrice: 0, compraLocal: false, compraInternacional: false })}
                className="flex items-center gap-1.5 rounded-xl border border-brand-magenta/30 px-3 py-2 text-xs font-semibold text-brand-magenta transition hover:bg-brand-magentaLight"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar ítem
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => {
                const qty = form.watch(`items.${idx}.qty`) || 0
                const unitPrice = form.watch(`items.${idx}.unitPrice`) || 0
                return (
                  <div key={field.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-magenta uppercase tracking-wide">Ítem {idx + 1}</span>
                      <button type="button" onClick={() => remove(idx)} disabled={fields.length === 1}
                        className="rounded-lg border border-red-200 p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[2fr_1fr_80px_90px_110px]">
                      <div>
                        <label className={labelCls}>Nombre *</label>
                        <input className={inputCls} placeholder="Nombre del producto/servicio" {...form.register(`items.${idx}.name`)} />
                        {form.formState.errors.items?.[idx]?.name && (
                          <p className="mt-1 text-xs text-red-600">{form.formState.errors.items[idx]?.name?.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Línea proyecto</label>
                        <input className={inputCls} placeholder="LP-001" {...form.register(`items.${idx}.spec`)} />
                      </div>
                      <div>
                        <label className={labelCls}>Unidad</label>
                        <input className={inputCls} placeholder="Caja" {...form.register(`items.${idx}.uom`)} />
                      </div>
                      <div>
                        <label className={labelCls}>Cantidad</label>
                        <input type="number" min="0.01" step="0.01" className={`${inputCls} text-right`}
                          {...form.register(`items.${idx}.qty`, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label className={labelCls}>Precio est. COP</label>
                        <input type="number" min="0" step="0.01" className={`${inputCls} text-right`} placeholder="0"
                          {...form.register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
                        {qty > 0 && unitPrice > 0 && (
                          <p className="mt-0.5 text-right text-[10px] text-brand-magenta font-medium">= {formatCOP(qty * unitPrice)}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Descripción técnica <span className="normal-case font-normal text-gray-400">(talla, peso, pulgadas, color, volumen…)</span></label>
                      <textarea rows={2} className={inputCls}
                        placeholder="Ej. Talla M, 100ml, color azul, certificado ISO 13485…"
                        {...form.register(`items.${idx}.descripcion`)} />
                    </div>
                    <div>
                      <label className={labelCls}>Comentario <span className="normal-case font-normal text-gray-400">(para qué, por qué, dónde se usa)</span></label>
                      <textarea rows={2} className={inputCls}
                        placeholder="Ej. Para cambio de drenaje post-quirúrgico en quirófano 2…"
                        {...form.register(`items.${idx}.comentario`)} />
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-brand-magenta"
                          {...form.register(`items.${idx}.compraLocal`)} />
                        <span className="font-medium">Compra local</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-brand-magenta"
                          {...form.register(`items.${idx}.compraInternacional`)} />
                        <span className="font-medium">Compra internacional</span>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>

            {(() => {
              const allItems = form.watch('items') || []
              const subtotal = allItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0)
              const ivaRate = form.watch('ivaRate') || 0
              const iva = subtotal * (ivaRate / 100)
              const total = subtotal + iva
              return total > 0 ? (
                <div className="mt-3 flex flex-col items-end gap-1 rounded-xl bg-brand-magentaLight/40 px-4 py-2">
                  <div className="flex gap-3 text-sm">
                    <span className="text-brand-plum/70">Subtotal:</span>
                    <span className="font-semibold text-brand-plum">{formatCOP(subtotal)}</span>
                  </div>
                  {ivaRate > 0 && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-brand-plum/70">IVA {ivaRate}%:</span>
                      <span className="font-semibold text-brand-plum">{formatCOP(iva)}</span>
                    </div>
                  )}
                  <div className="flex gap-3 text-sm">
                    <span className="text-brand-plum/70">Total estimado:</span>
                    <span className="font-bold text-brand-magenta">{formatCOP(total)}</span>
                  </div>
                </div>
              ) : null
            })()}

          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/rq/${rq.id}`)}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>

        </form>
      </div>
    </Layout>
  )
}
