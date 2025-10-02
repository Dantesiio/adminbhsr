// The new requisition page is a client component.  It uses
// React‑Hook‑Form and Zod for form state management and validation.
'use client'

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRQ } from '../actions'
import type { CreateRQInput } from '../actions'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'

// Schema definitions reused for local form validation.  These mirror
// the server side schemas defined in actions.ts.
const ItemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  spec: z.string().optional(),
  qty: z.number().positive('> 0'),
  uom: z.string().optional(),
})
const RQSchema = z.object({
  projectId: z.string().min(1, 'Selecciona un proyecto'),
  costCenterId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  items: z.array(ItemSchema).min(1, 'Agrega al menos 1 ítem'),
})
type RQForm = z.infer<typeof RQSchema>

export default function NewRQPage() {
  const router = useRouter()
  const form = useForm<RQForm>({
    resolver: zodResolver(RQSchema),
    defaultValues: { items: [{ name: '', spec: '', qty: 1, uom: 'unidad' }] },
  })
  const { fields, append, remove } = useFieldArray({ name: 'items', control: form.control })
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [costCenters, setCostCenters] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch reference data on mount.  This call hits our API route.
  useEffect(() => {
    fetch('/api/catalogs')
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects)
        setCostCenters(d.costCenters)
      })
  }, [])

  // Handle form submission.  The server action returns the created
  // requisition; we alert the user and reset the form.
  async function onSubmit(values: RQForm) {
    setSubmitting(true)
    try {
      // Convert number inputs to the expected format for the server action
      const normalizedValues: CreateRQInput = {
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
      const rq = await createRQ(normalizedValues)
      alert(`RQ creada exitosamente: ${rq.code}`)
      form.reset()
      router.push('/dashboard?role=SOLICITANTE')
    } catch (error) {
      console.error('Error creating RQ:', error)
      alert('Error al crear la RQ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout currentRole="SOLICITANTE">
      <div className="space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Solicitante</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Crear nueva requisición</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Completa la información del proyecto y los ítems requeridos. Una vez enviada, compras recibirá una alerta para iniciar el proceso de cotización.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs uppercase tracking-widest text-white/80 shadow backdrop-blur">
              Tiempo estimado: 5 minutos
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Información de la solicitud</h2>
                <p className="mt-1 text-sm text-slate-500">Los campos marcados con * son obligatorios.</p>
              </div>
              <button
                type="button"
                onClick={() => form.reset()}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              >
                Limpiar formulario
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto *
                </label>
                <select 
                  id="projectId"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  {...form.register('projectId')}
                >
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.projectId && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.projectId.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="costCenterId" className="block text-sm font-medium text-gray-700 mb-2">
                  Centro de Costo (opcional)
                </label>
                <select 
                  id="costCenterId"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  {...form.register('costCenterId')}
                >
                  <option value="">Seleccionar...</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                id="title"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej. Compra de bolsas para quirófano"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea 
                id="description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                rows={3}
                placeholder="Descripción detallada de la requisición..."
                {...form.register('description')} 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Ítems de la Requisición</h2>
                <button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => append({ name: '', spec: '', qty: 1, uom: 'unidad' })}
                >
                  + Agregar Ítem
                </button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg">
                    <div className="col-span-12 sm:col-span-4">
                      <label htmlFor={`${field.id}-name`} className="block text-xs font-medium text-gray-500 mb-1">
                        Nombre del Producto *
                      </label>
                      <input
                        id={`${field.id}-name`}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre del producto"
                        {...form.register(`items.${idx}.name` as const)}
                      />
                      {form.formState.errors.items?.[idx]?.name && (
                        <p className="text-red-600 text-xs mt-1">
                          {form.formState.errors.items[idx]?.name?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="col-span-12 sm:col-span-4">
                      <label htmlFor={`${field.id}-spec`} className="block text-xs font-medium text-gray-500 mb-1">
                        Especificación
                      </label>
                      <input
                        id={`${field.id}-spec`}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Especificaciones técnicas"
                        {...form.register(`items.${idx}.spec` as const)}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor={`${field.id}-qty`} className="block text-xs font-medium text-gray-500 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        id={`${field.id}-qty`}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...form.register(`items.${idx}.qty` as const, { valueAsNumber: true })}
                      />
                      {form.formState.errors.items?.[idx]?.qty && (
                        <p className="text-red-600 text-xs mt-1">
                          {form.formState.errors.items[idx]?.qty?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="col-span-5 sm:col-span-1">
                      <label htmlFor={`${field.id}-uom`} className="block text-xs font-medium text-gray-500 mb-1">
                        Unidad
                      </label>
                      <input
                        id={`${field.id}-uom`}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: unidad"
                        {...form.register(`items.${idx}.uom` as const)}
                      />
                    </div>
                    
                    <div className="col-span-1 flex items-end">
                      <button
                        type="button"
                        className="w-full border border-red-300 text-red-600 rounded-md px-2 py-2 hover:bg-red-50 transition-colors"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                      >
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.items && (
                <p className="text-red-600 text-sm mt-2">
                  {form.formState.errors.items.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard?role=SOLICITANTE')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Creando...' : 'Crear Requisición'}
              </button>
            </div>
            </form>
          </div>
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Flujo de aprobación</h3>
              <p className="mt-2 text-xs text-slate-500">
                Tu requisición se enviará automáticamente a Compras. Desde allí se generarán cotizaciones, comparativos y autorizaciones según el flujo institucional.
              </p>
              <div className="mt-4">
                <WorkflowTimeline currentStatus="ENVIADA_COMPRAS" compact />
              </div>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-700">Tips rápidos</h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Detalla las especificaciones para facilitar la cotización.
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Incluye cantidades exactas y unidades de medida.
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Adjunta notas especiales si el ítem requiere entrega programada.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}