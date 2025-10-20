'use client'

import Layout from '@/components/Layout'
import type { AppRole } from '@/lib/roles'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión, no mostrar nada (ya se redirigió)
  if (!session?.user) {
    return null
  }

  const role = session.user.role
  const appRoles: AppRole[] = ['SOLICITANTE', 'COMPRAS', 'AUTORIZADOR', 'ADMIN']
  const normalizedRole = appRoles.includes(role as AppRole) ? (role as AppRole) : 'SOLICITANTE'

  const roleCards = {
    SOLICITANTE: [
      {
        title: 'Nueva RQ',
        description: 'Crear nuevas requisiciones',
        href: '/rq/new',
        buttonText: 'Crear RQ',
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        title: 'Mis Requisiciones',
        description: 'Seguimiento de solicitudes existentes',
        href: '/dashboard?role=SOLICITANTE',
        buttonText: 'Ver Dashboard',
        color: 'bg-gray-600 hover:bg-gray-700',
      },
    ],
    COMPRAS: [
      {
        title: 'RQs Pendientes',
        description: 'Gestionar cotizaciones y comparativos',
        href: '/dashboard?role=COMPRAS',
        buttonText: 'Ver Pendientes',
        color: 'bg-green-600 hover:bg-green-700',
      },
    ],
    AUTORIZADOR: [
      {
        title: 'Pendientes Autorización',
        description: 'Revisar y autorizar requisiciones',
        href: '/dashboard?role=AUTORIZADOR',
        buttonText: 'Ver Pendientes',
        color: 'bg-orange-600 hover:bg-orange-700',
      },
    ],
    ADMIN: [
      {
        title: 'Dashboard Admin',
        description: 'Configuración del sistema',
        href: '/dashboard?role=ADMIN',
        buttonText: 'Ver Dashboard',
        color: 'bg-red-600 hover:bg-red-700',
      },
    ],
  }

  const cards = roleCards[role as keyof typeof roleCards] || []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <Layout>
      <div className="min-h-[70vh] bg-slate-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
          <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 p-10 text-white shadow-xl">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-32 -left-8 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative z-10 max-w-xl space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">
                  Hospital San Rafael
                </span>
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                  Plataforma integral para requisiciones digitales
                </h1>
                <p className="text-base text-blue-100 sm:text-lg">
                  Coordina solicitudes, cotizaciones, aprobaciones y órdenes de compra desde un mismo lugar.
                  Visualiza el estado real de cada RQ y comunica a los equipos con claridad.
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href="/rq/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Registrar RQ
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                  >
                    Ver tablero
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Atajos rápidos
                </h2>
                <div className="mt-5 grid gap-3">
                  {cards.slice(0, 3).map((card) => (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/70"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                        <p className="text-xs text-slate-500">{card.description}</p>
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white ${card.color.split(' ')[0]}`}>
                        {card.buttonText}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Estado del flujo
                </h2>
                <div className="mt-6 flex flex-wrap gap-4">
                  {[
                    { label: 'RQ activas', value: '12', trend: '+3', color: 'bg-blue-100 text-blue-600' },
                    { label: 'En comparación', value: '4', trend: '+1', color: 'bg-yellow-100 text-yellow-600' },
                    { label: 'Pendientes de aprobación', value: '2', trend: '-1', color: 'bg-orange-100 text-orange-600' },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[120px] flex-1 rounded-2xl bg-slate-50 p-4 text-sm">
                      <p className="text-xs font-medium text-slate-500">{item.label}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-slate-900">{item.value}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.color}`}>
                          {item.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 sm:p-8 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Buscar requisiciones</h2>
                <p className="text-sm text-slate-500">
                  Localiza RQs por código, proyecto o proveedor y continúa donde lo dejaste.
                </p>
              </div>
              <form onSubmit={handleSearch} className="w-full sm:w-auto">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por código RQ/OC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 sm:px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Acciones clave para {normalizedRole.toLowerCase()}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sugerencias rápidas basadas en tu rol para avanzar cada requisición.
              </p>
              <div className="mt-6 space-y-4">
                {cards.map((card) => (
                  <div key={card.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${card.color.split(' ')[0]}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                      <p className="text-xs text-slate-500">{card.description}</p>
                      <Link
                        href={card.href}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {card.buttonText}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Workflow de requisiciones</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  7 etapas
                </span>
              </div>
              <div className="mt-8 grid gap-4">
                {[
                  { step: 'RQ creada', description: 'Solicitud registrada y enviada al equipo de compras.' },
                  { step: 'Cotización', description: 'Compras envía solicitudes a proveedores y recibe ofertas.' },
                  { step: 'Comparativo', description: 'Se evalúan propuestas y se elige al proveedor óptimo.' },
                  { step: 'Autorización', description: 'El flujo de aprobación valida presupuesto y alcance.' },
                  { step: 'Orden de compra', description: 'Se genera la OC y se notifica al proveedor elegido.' },
                  { step: 'Recepción', description: 'Se verifica entrega, calidad y se capturan soportes.' },
                  { step: 'Cierre', description: 'Se documenta el cierre con incidencias y aprendizajes.' },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.step}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 sm:p-8 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-600">
              Hospital San Rafael · AdminBHSR — Versión Beta
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Desarrollado con Next.js, Prisma y Tailwind CSS para acelerar la gestión de requisiciones.
            </p>
          </footer>
        </div>
      </div>
    </Layout>
  )
}