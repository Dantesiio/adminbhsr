'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'
import { getRoleFromQuery } from '@/lib/roles'
import type { AppRole } from '@/lib/roles'
import { workflowPath, type WorkflowStatus, getRoleGuidance } from '@/lib/workflow'

type RQ = {
  id: string
  code: string
  title: string
  status: string
  createdAt: Date
  project: string
  amount: number
  currency: string
  requester: string
}

type RolePlaybook = {
  title: string
  subtitle: string
  steps: { title: string; description: string }[]
  cta?: { label: string; href: string }
}

type MetricAccent = 'blue' | 'emerald' | 'amber' | 'violet' | 'rose'

const metricBackgrounds: Record<MetricAccent, string> = {
  blue: 'from-sky-500/30 via-blue-500/20 to-indigo-500/30',
  emerald: 'from-emerald-500/30 via-teal-500/20 to-green-500/30',
  amber: 'from-amber-500/30 via-orange-500/20 to-yellow-500/30',
  violet: 'from-violet-500/30 via-purple-500/20 to-indigo-500/30',
  rose: 'from-rose-500/30 via-red-500/20 to-pink-500/30',
}

const playbookBadgeClasses: Record<AppRole, string> = {
  SOLICITANTE: 'bg-blue-100 text-blue-700',
  COMPRAS: 'bg-amber-100 text-amber-700',
  AUTORIZADOR: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-emerald-100 text-emerald-700',
}

const rolePlaybook: Record<AppRole, RolePlaybook> = {
  SOLICITANTE: {
    title: 'Checklist del solicitante',
    subtitle: 'Prepara documentación, da seguimiento y responde comentarios sin demoras.',
    steps: [
      {
        title: 'Prepara la requisición',
        description: 'Confirma proyecto y centro de costo, adjunta soportes y valida cantidades clave.',
      },
      {
        title: 'Envía a Compras',
        description: 'Monitorea la bandeja y conversa con Compras cuando necesiten aclaraciones.',
      },
      {
        title: 'Atiende ajustes',
        description: 'Si se rechaza, revisa comentarios, ajusta y reenvía para mantener el flujo activo.',
      },
    ],
    cta: { label: 'Crear nueva RQ', href: '/rq/new' },
  },
  COMPRAS: {
    title: 'Flujo de compras',
    subtitle: 'Gestiona cotizaciones, arma comparativos y comunica el avance del proceso.',
    steps: [
      {
        title: 'Clasifica la solicitud',
        description: 'Valida la información del solicitante y prioriza según criticidad y monto.',
      },
      {
        title: 'Captura cotizaciones',
        description: 'Carga propuestas con soporte, evalúa condiciones y arma el comparativo ganador.',
      },
      {
        title: 'Envía a autorización',
        description: 'Comparte comentarios clave y asegura que los autorizadores reciban toda la evidencia.',
      },
    ],
  },
  AUTORIZADOR: {
    title: 'Ruta del autorizador',
    subtitle: 'Evalúa comparativos, verifica presupuesto y deja rastro de decisiones claras.',
    steps: [
      {
        title: 'Revisa el comparativo',
        description: 'Analiza precios, justificación y cumplimiento de políticas antes de decidir.',
      },
      {
        title: 'Valida presupuesto',
        description: 'Confirma disponibilidad y prioridades del proyecto o centro de costo.',
      },
      {
        title: 'Aprueba o devuelve',
        description: 'Aprueba cuando cumple criterios o rechaza con comentarios accionables.',
      },
    ],
  },
  ADMIN: {
    title: 'Control administrativo',
    subtitle: 'Monitorea indicadores, anticipa bloqueos y asegura cierres trazables.',
    steps: [
      {
        title: 'Monitorea indicadores',
        description: 'Revisa tiempos por etapa y prioriza incidencias junto a Compras.',
      },
      {
        title: 'Acompaña incidencias',
        description: 'Facilita soporte para requisiciones detenidas y alinea a los equipos.',
      },
      {
        title: 'Cierra el ciclo',
        description: 'Documenta cierres, asegura adjuntos completos y genera reportes ejecutivos.',
      },
    ],
  },
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<RQ[]>([])
  const [roleDataset, setRoleDataset] = useState<RQ[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [projectOptions, setProjectOptions] = useState<string[]>([])
  const [timelineStatus, setTimelineStatus] = useState<WorkflowStatus | undefined>()
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const role = getRoleFromQuery(searchParams)
  const statusFilter = searchParams.get('status') || ''
  const projectFilter = searchParams.get('project') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const mockData: RQ[] = [
        {
          id: '1',
          code: 'RQ-0001',
          title: 'Compra de bolsas quirúrgicas',
          status: 'ENVIADA_COMPRAS',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
          project: 'Unidad Quirúrgica 2025',
          amount: 2150000,
          currency: 'COP',
          requester: 'Logística HSR',
        },
        {
          id: '2',
          code: 'RQ-0002',
          title: 'Material de curación',
          status: 'EN_COMPARATIVO',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
          project: 'Hospitalización General',
          amount: 890000,
          currency: 'COP',
          requester: 'Centro Logístico',
        },
        {
          id: '3',
          code: 'RQ-0003',
          title: 'Equipos de laboratorio',
          status: 'EN_AUTORIZACION',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          project: 'Laboratorio Clínico',
          amount: 14500000,
          currency: 'COP',
          requester: 'Investigación HSR',
        },
        {
          id: '4',
          code: 'RQ-0004',
          title: 'Servicio de mantenimiento equipos RX',
          status: 'APROBADA',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
          project: 'Imagenología',
          amount: 3800000,
          currency: 'COP',
          requester: 'Ingeniería Clínica',
        },
        {
          id: '5',
          code: 'RQ-0005',
          title: 'Compra de nebulizadores pediátricos',
          status: 'OC_EMITIDA',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8),
          project: 'Pediatría',
          amount: 5600000,
          currency: 'COP',
          requester: 'Piso 4',
        },
        {
          id: '6',
          code: 'RQ-0006',
          title: 'Reposición de medicamentos alto costo',
          status: 'EN_RECEPCION',
          createdAt: new Date(now.getTime() - 1000 * 60 * 30),
          project: 'Farmacia',
          amount: 32000000,
          currency: 'COP',
          requester: 'Tesorería',
        },
        {
          id: '7',
          code: 'RQ-0007',
          title: 'Contrato de esterilización externa',
          status: 'CERRADA',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14),
          project: 'Central de Esterilización',
          amount: 9800000,
          currency: 'COP',
          requester: 'Compras Estratégicas',
        },
        {
          id: '8',
          code: 'RQ-0008',
          title: 'Actualizar licencias software diagnóstico',
          status: 'RECHAZADA',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
          project: 'Sistemas HSR',
          amount: 4200000,
          currency: 'COP',
          requester: 'TI Hospital',
        },
      ]

      // Apply role filter
      let filteredByRole = mockData
      if (role === 'COMPRAS') {
        filteredByRole = filteredByRole.filter(r => ['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'EN_AUTORIZACION'].includes(r.status))
      } else if (role === 'SOLICITANTE') {
        filteredByRole = filteredByRole.filter(r => ['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'EN_AUTORIZACION', 'APROBADA', 'RECHAZADA', 'OC_EMITIDA', 'CERRADA'].includes(r.status))
      } else if (role === 'AUTORIZADOR') {
        filteredByRole = filteredByRole.filter(r => ['EN_AUTORIZACION', 'APROBADA', 'RECHAZADA'].includes(r.status))
      }

      const counts = filteredByRole.reduce((acc, rq) => {
        acc[rq.status] = (acc[rq.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setRoleDataset(filteredByRole)
      setStatusCounts(counts)

      const projects = Array.from(new Set(filteredByRole.map(r => r.project))).sort((a, b) =>
        a.localeCompare(b, 'es-CO')
      )
      setProjectOptions(projects)

      const filteredForFilters = filteredByRole.filter((rq) => {
        if (statusFilter && rq.status !== statusFilter) return false
        if (projectFilter && rq.project !== projectFilter) return false
        return true
      })

      // Determine timeline focus based on earliest stage in workflow path
      const ordered = [...filteredByRole].sort((a, b) => {
        const orderA = workflowPath.indexOf(a.status as WorkflowStatus)
        const orderB = workflowPath.indexOf(b.status as WorkflowStatus)
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB)
      })

      setTimelineStatus(ordered[0]?.status as WorkflowStatus | undefined)

      setData(filteredForFilters.slice((page - 1) * limit, page * limit))
      setTotalCount(filteredForFilters.length)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [role, statusFilter, projectFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/dashboard?${params}`)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ENVIADA_COMPRAS: 'bg-blue-100 text-blue-800',
      EN_COMPARATIVO: 'bg-yellow-100 text-yellow-800',
      EN_AUTORIZACION: 'bg-orange-100 text-orange-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      OC_EMITIDA: 'bg-purple-100 text-purple-800',
      EN_RECEPCION: 'bg-indigo-100 text-indigo-800',
      CERRADA: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getActionForRole = (rqId: string, status: string, role: string) => {
    if (role === 'COMPRAS' && ['ENVIADA_COMPRAS', 'EN_COMPARATIVO'].includes(status)) {
      return (
        <Link
          href={`/rq/${rqId}/quotes?role=${role}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Gestionar Cotizaciones
        </Link>
      )
    }
    if (role === 'AUTORIZADOR' && status === 'EN_AUTORIZACION') {
      return (
        <Link
          href={`/rq/${rqId}/approve?role=${role}`}
          className="text-green-600 hover:text-green-800 font-medium"
        >
          Revisar
        </Link>
      )
    }
    if (role === 'SOLICITANTE' && status === 'RECHAZADA') {
      return (
        <Link
          href={`/rq/${rqId}?role=${role}`}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Ver comentarios
        </Link>
      )
    }
    return (
      <Link
        href={`/rq/${rqId}?role=${role}`}
        className="text-gray-600 hover:text-gray-800 font-medium"
      >
        Ver Detalles
      </Link>
    )
  }

  const totalPages = Math.ceil(totalCount / limit)

  const metrics = useMemo(() => {
    const sum = (statuses: WorkflowStatus[]) =>
      statuses.reduce((acc, status) => acc + (statusCounts[status] ?? 0), 0)

    switch (role) {
      case 'SOLICITANTE':
        return [
          {
            label: 'Seguimiento activo',
            value: sum(['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'EN_AUTORIZACION'] as WorkflowStatus[]),
            hint: 'RQs en movimiento con Compras o Autorización.',
            accent: 'blue' as MetricAccent,
          },
          {
            label: 'Listas para cerrar',
            value: sum(['APROBADA', 'OC_EMITIDA', 'EN_RECEPCION', 'CERRADA'] as WorkflowStatus[]),
            hint: 'Listas para OC, recepción o cierre definitivo.',
            accent: 'emerald' as MetricAccent,
          },
          {
            label: 'Requieren ajustes',
            value: sum(['RECHAZADA'] as WorkflowStatus[]),
            hint: 'Devueltas con comentarios pendientes.',
            accent: 'rose' as MetricAccent,
          },
        ]
      case 'COMPRAS':
        return [
          {
            label: 'Por cotizar',
            value: sum(['ENVIADA_COMPRAS'] as WorkflowStatus[]),
            hint: 'Requisiciones recién recibidas.',
            accent: 'blue' as MetricAccent,
          },
          {
            label: 'En comparativo',
            value: sum(['EN_COMPARATIVO'] as WorkflowStatus[]),
            hint: 'Evaluando proveedores y costos.',
            accent: 'amber' as MetricAccent,
          },
          {
            label: 'Esperando autorización',
            value: sum(['EN_AUTORIZACION'] as WorkflowStatus[]),
            hint: 'Enviadas a firma y seguimiento.',
            accent: 'violet' as MetricAccent,
          },
        ]
      case 'AUTORIZADOR':
        return [
          {
            label: 'Pendientes por revisar',
            value: sum(['EN_AUTORIZACION'] as WorkflowStatus[]),
            hint: 'Comparativos listos para decisión.',
            accent: 'amber' as MetricAccent,
          },
          {
            label: 'Autorizadas',
            value: sum(['APROBADA'] as WorkflowStatus[]),
            hint: 'Decisiones positivas recientes.',
            accent: 'emerald' as MetricAccent,
          },
          {
            label: 'Devueltas',
            value: sum(['RECHAZADA'] as WorkflowStatus[]),
            hint: 'Solicitudes que requieren ajustes.',
            accent: 'rose' as MetricAccent,
          },
        ]
      case 'ADMIN':
      default:
        return [
          {
            label: 'Procesos activos',
            value: sum(['ENVIADA_COMPRAS', 'EN_COMPARATIVO', 'EN_AUTORIZACION', 'APROBADA', 'OC_EMITIDA', 'EN_RECEPCION'] as WorkflowStatus[]),
            hint: 'Flujos en curso dentro del ciclo.',
            accent: 'blue' as MetricAccent,
          },
          {
            label: 'Cerradas',
            value: sum(['CERRADA'] as WorkflowStatus[]),
            hint: 'Requisiciones concluidas.',
            accent: 'emerald' as MetricAccent,
          },
          {
            label: 'Incidencias',
            value: sum(['RECHAZADA'] as WorkflowStatus[]),
            hint: 'Requieren soporte o seguimiento.',
            accent: 'rose' as MetricAccent,
          },
        ]
    }
  }, [role, statusCounts])

  const prioritizedActions = useMemo(() => {
    if (!roleDataset.length) return []
    return [...roleDataset]
      .sort((a, b) => {
        const orderA = workflowPath.indexOf(a.status as WorkflowStatus)
        const orderB = workflowPath.indexOf(b.status as WorkflowStatus)
        const safeA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA
        const safeB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB
        if (safeA === safeB) {
          return b.createdAt.getTime() - a.createdAt.getTime()
        }
        return safeA - safeB
      })
      .slice(0, 3)
  }, [roleDataset])

  const roleGuidanceList = useMemo(() => getRoleGuidance(role), [role])
  const playbook = rolePlaybook[role]

  const roleCopy = {
    SOLICITANTE: {
      headline: 'Seguimiento de requisiciones',
      sub: 'Mantén la comunicación con Compras y responde ajustes rápidamente.',
    },
    COMPRAS: {
      headline: 'Bandeja de compras',
      sub: 'Prioriza RQs entrantes, asegura comparativos completos y comunica avances.',
    },
    AUTORIZADOR: {
      headline: 'Autorizaciones pendientes',
      sub: 'Revisa comparativos y deja comentarios claros para el equipo.',
    },
    ADMIN: {
      headline: 'Visión general del flujo',
      sub: 'Monitorea el estado de cada RQ y asegura cumplimiento del proceso.',
    },
  } as const

  const statusCardOrder: WorkflowStatus[] = [
    'ENVIADA_COMPRAS',
    'EN_COMPARATIVO',
    'EN_AUTORIZACION',
    'APROBADA',
    'OC_EMITIDA',
    'EN_RECEPCION',
    'CERRADA',
  ]

  const paginatedStart = (page - 1) * limit + 1
  const paginatedEnd = Math.min(page * limit, totalCount)
  const statusFieldId = 'dashboard-status-filter'
  const projectFieldId = 'dashboard-project-filter'

  let listContent: JSX.Element
  if (loading) {
    listContent = (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Cargando bandeja...
        </div>
      </div>
    )
  } else if (data.length > 0) {
    listContent = (
      <div className="space-y-4">
        {data.map((rq) => {
          const orderIndex = workflowPath.indexOf(rq.status as WorkflowStatus)
          const progress = orderIndex === -1
            ? 0
            : Math.round(((orderIndex + 1) / workflowPath.length) * 100)

          return (
            <article
              key={rq.id}
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {rq.code}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusColor(rq.status)}`}>
                      {rq.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{rq.title}</h3>
                  <p className="text-xs text-slate-500">{rq.requester} • {rq.project}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Monto estimado</p>
                  <p className="text-xl font-bold text-slate-900">
                    {rq.currency} {rq.amount.toLocaleString('es-CO')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Actualizado {rq.createdAt.toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Progreso del flujo</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  Próximo paso: {workflowPath[orderIndex + 1] ? workflowPath[orderIndex + 1].replace(/_/g, ' ') : 'Cierre'}
                </div>
                {getActionForRole(rq.id, rq.status, role)}
              </div>
            </article>
          )
        })}
      </div>
    )
  } else {
    listContent = (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M5 5h6l2 2h6v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-slate-700">No hay requisiciones en esta vista</p>
            <p className="mt-1 text-xs text-slate-500">Ajusta los filtros o revisa otro estado del flujo.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout currentRole={role}>
      <div className="space-y-10">
        <header className="flex flex-col gap-6 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">{role}</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">
                {roleCopy[role]?.headline || 'Dashboard'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {roleCopy[role]?.sub}
              </p>
            </div>
            {role === 'SOLICITANTE' && (
              <Link
                href="/rq/new"
                className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow hover:shadow-lg"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva requisición
              </Link>
            )}
          </div>
          {metrics.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-sm backdrop-blur"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${metricBackgrounds[metric.accent]} opacity-80`} />
                  <div className="relative space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">{metric.label}</p>
                    <p className="text-3xl font-bold text-white">{metric.value}</p>
                    <p className="text-xs text-white/80">{metric.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statusCardOrder.map((status) => {
              const count = statusCounts[status] || 0
              return (
                <div
                  key={status}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/80"
                >
                  <p className="text-[10px] text-white/70">{status.replace(/_/g, ' ')}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{count}</p>
                </div>
              )
            })}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={statusFieldId} className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Estado
                  </label>
                  <select
                    id={statusFieldId}
                    value={statusFilter}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="">Todos</option>
                    <option value="ENVIADA_COMPRAS">Enviada a Compras</option>
                    <option value="EN_COMPARATIVO">En Comparativo</option>
                    <option value="EN_AUTORIZACION">En Autorización</option>
                    <option value="APROBADA">Aprobada</option>
                    <option value="RECHAZADA">Rechazada</option>
                    <option value="OC_EMITIDA">OC Emitida</option>
                    <option value="EN_RECEPCION">En Recepción</option>
                    <option value="CERRADA">Cerrada</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={projectFieldId} className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Proyecto
                  </label>
                  <select
                    id={projectFieldId}
                    value={projectFilter}
                    onChange={(e) => handleFilterChange('project', e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="">Todos</option>
                    {projectOptions.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {totalCount > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Mostrando {paginatedStart}-{paginatedEnd} de {totalCount} requisiciones
                </p>
              )}
            </div>

            <div className="space-y-4">{listContent}</div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {page > 1 && (
                  <button
                    onClick={() => handleFilterChange('page', (page - 1).toString())}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    Anterior
                  </button>
                )}
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <button
                    onClick={() => handleFilterChange('page', (page + 1).toString())}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Playbook del rol</h3>
              <p className="mt-2 text-xs text-slate-500">{playbook.subtitle}</p>
              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                {playbook.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-wide ${playbookBadgeClasses[role]}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {playbook.cta && (
                <Link
                  href={playbook.cta.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {playbook.cta.label}
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Mapa del flujo</h3>
              <p className="mt-2 text-xs text-slate-500">Visualiza en qué etapa se encuentra tu requisición más adelantada.</p>
              <div className="mt-4">
                <WorkflowTimeline currentStatus={timelineStatus} compact />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-6 text-blue-900 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-700">Siguientes acciones</h3>
              <p className="mt-2 text-xs text-blue-600">Prioriza los próximos movimientos de tu bandeja.</p>
              <ul className="mt-4 space-y-3 text-sm">
                {prioritizedActions.map((rq) => (
                  <li key={rq.id} className="rounded-xl bg-white/75 px-4 py-3 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
                      <span>{rq.code}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        {rq.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-600">{rq.title}</p>
                    <div className="mt-2 text-xs font-semibold text-blue-500">
                      {getActionForRole(rq.id, rq.status, role)}
                    </div>
                  </li>
                ))}
                {prioritizedActions.length === 0 && (
                  <li className="rounded-xl bg-white/60 px-4 py-3 text-xs text-blue-600">No hay acciones pendientes para este rol.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Notas del flujo</h3>
              <p className="mt-2 text-xs text-slate-500">Recomendaciones claves para que el proceso fluya sin retrabajos.</p>
              {roleGuidanceList.length > 0 ? (
                <ul className="mt-4 space-y-3 text-xs text-slate-600">
                  {roleGuidanceList.map((tip) => (
                    <li key={tip} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-slate-500">Mantén comunicación con tu equipo y registra cada cambio importante.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}