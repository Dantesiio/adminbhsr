'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'
import { getStageByStatus } from '@/lib/workflow'

interface RQ {
  id: string
  code: string
  title: string
  status: string
  description?: string
  total?: number
  currency?: string
  project: {
    name: string
  }
  requester: {
    name: string
  }
  comparison?: {
    chosen?: {
      name: string
    }
  }
}

export default function RQApprovePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'AUTORIZADOR'
  
  const [rq, setRQ] = useState<RQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (!isMounted) return

        setRQ({
          id: params.id,
          code: 'RQ-0001',
          title: 'Compra de bolsas',
          status: 'EN_AUTORIZACION',
          description: 'Bolsas para proyecto ECHO',
          total: 2500000,
          currency: 'COP',
          project: { name: 'ECHO Bolsas 06/2025' },
          requester: { name: 'Solicitante Demo' },
          comparison: {
            chosen: { name: 'Proveedor A' }
          }
        })
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [params.id])

  const handleApproval = async (status: 'APROBADA' | 'RECHAZADA') => {
    if (!comment.trim()) {
      alert('Por favor agregue un comentario')
      return
    }

    setSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      alert(status === 'APROBADA' ? 'Requisición aprobada' : 'Requisición rechazada')
      router.push(`/dashboard?role=${role}`)
    } catch (error) {
      console.error('Error processing approval:', error)
      alert('Ocurrió un error al registrar la decisión')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout currentRole={role}>
        <div className="flex h-64 items-center justify-center text-gray-500">Cargando...</div>
      </Layout>
    )
  }

  if (!rq) {
    return (
      <Layout currentRole={role}>
        <div className="text-center text-gray-500">Requisición no encontrada</div>
      </Layout>
    )
  }

  const currentStage = getStageByStatus(rq.status)
  const checklistItems = [
    {
      label: 'Presupuesto disponible',
      description: 'Validar que el proyecto tiene recursos suficientes para la compra',
    },
    {
      label: 'Justificación adecuada',
      description: 'Confirmar que la necesidad y el proveedor seleccionado están bien soportados',
    },
    {
      label: 'Proveedor calificado',
      description: 'Verificar antecedentes, cumplimiento de auditorías y documentos al día',
    },
    {
      label: 'Precios de mercado',
      description: 'Comparar contra histórico y cotizaciones alternativas',
    },
  ]

  return (
    <Layout currentRole={role}>
      <div className="space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Autorización</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Revisar y aprobar RQ</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {rq.code} • {rq.project.name}
              </p>
              {currentStage && (
                <p className="mt-1 max-w-xl text-xs text-white/70">{currentStage.description}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push(`/rq/${params.id}?role=${role}`)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Ver detalles completos
              </button>
              <button
                onClick={() => router.push(`/dashboard?role=${role}`)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-red-600 shadow hover:shadow-lg"
              >
                Volver al dashboard
              </button>
            </div>
          </div>
          <div className="mt-6">
            <WorkflowTimeline currentStatus={rq.status} compact />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-slate-900">Resumen de la requisición</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-gray-700">Proyecto</div>
                  <p className="text-sm text-gray-900">{rq.project.name}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Solicitante</div>
                  <p className="text-sm text-gray-900">{rq.requester.name}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Proveedor recomendado</div>
                  <p className="text-sm text-gray-900">{rq.comparison?.chosen?.name ?? 'N/A'}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Valor total estimado</div>
                  <p className="text-lg font-semibold text-gray-900">
                    {rq.currency} {rq.total?.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              {rq.description && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700">Descripción</div>
                  <p className="text-sm text-gray-900">{rq.description}</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-slate-900">Lista de verificación</h2>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <label
                    key={item.label}
                    className="flex items-start space-x-3 rounded-2xl border border-slate-200 p-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-slate-900">Decisión de autorización</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="approvalComment" className="mb-2 block text-sm font-medium text-gray-700">
                    Comentarios de la autorización *
                  </label>
                  <textarea
                    id="approvalComment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="h-24 w-full rounded-md border px-3 py-2"
                    placeholder="Agregue sus comentarios sobre la autorización..."
                    required
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleApproval('APROBADA')}
                    disabled={submitting || !comment.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {submitting ? 'Procesando...' : 'Aprobar RQ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproval('RECHAZADA')}
                    disabled={submitting || !comment.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {submitting ? 'Procesando...' : 'Rechazar RQ'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div
              className="rounded-3xl border border-white/20 bg-white/40 p-6 text-sm text-white shadow backdrop-blur"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))' }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-white">
                Resumen ejecutivo
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                Revisa montos, el proveedor recomendado y los documentos soporte. Si tienes dudas, deja comentarios claros
                para el equipo de Compras.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Documentos clave</h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">Comparativo.pdf</span>
                  <button className="text-xs font-semibold text-blue-600 transition hover:text-blue-800">Ver</button>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">Cotización Proveedor A</span>
                  <button className="text-xs font-semibold text-blue-600 transition hover:text-blue-800">Ver</button>
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  )
}
