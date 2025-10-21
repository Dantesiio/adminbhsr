'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactNode, Suspense, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getRoleGuidance } from '@/lib/workflow'
import type { AppRole } from '@/lib/roles'
import logoHorizontal from '@/lib/images/logobhsr.png'

interface LayoutProps {
  readonly children: ReactNode
  readonly currentRole?: string
}

function LayoutShell({ children, currentRole: propRole }: LayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showGuidance, setShowGuidance] = useState(false)

  const currentRole = session?.user?.role || propRole || 'SOLICITANTE'
  const roleLinks = {
    SOLICITANTE: [
      { href: '/rq/new', label: 'Nueva RQ' },
      { href: '/dashboard?role=SOLICITANTE', label: 'Mis Requisiciones' },
    ],
    COMPRAS: [
      { href: '/dashboard?role=COMPRAS', label: 'RQs Pendientes' },
      { href: '/rq', label: 'Requisiciones' },
      { href: '/suppliers', label: 'Proveedores' },
    ],
    AUTORIZADOR: [
      { href: '/dashboard?role=AUTORIZADOR', label: 'Pendientes Autorización' },
      { href: '/rq', label: 'Listado de RQs' },
    ],
    ADMIN: [
      { href: '/dashboard?role=ADMIN', label: 'Dashboard Admin' },
      { href: '/projects', label: 'Proyectos' },
      { href: '/cost-centers', label: 'Centros de Costo' },
      { href: '/suppliers', label: 'Proveedores' },
    ],
  }

  const links = roleLinks[currentRole as keyof typeof roleLinks] || []

  const appRoles: AppRole[] = ['SOLICITANTE', 'COMPRAS', 'AUTORIZADOR', 'ADMIN']
  const normalizedRole = appRoles.includes(currentRole as AppRole)
    ? (currentRole as AppRole)
    : 'SOLICITANTE'

  const guidance = useMemo(() => getRoleGuidance(normalizedRole), [normalizedRole])

  return (
  <div className="min-h-screen bg-[#fefbfe] overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-magenta via-brand-magentaDark to-brand-purple pb-4 shadow-lg shadow-brand">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col gap-4 pt-4 sm:pt-6">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="group inline-flex items-center gap-3 text-white">
                  <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/15 p-1 shadow-brandSoft transition group-hover:bg-white/20">
                    <Image
                      src={logoHorizontal}
                      alt="Barco Hospital San Raffaele"
                      className="h-full w-full object-contain"
                      priority
                      sizes="40px"
                    />
                  </span>
                  <span className="text-2xl font-semibold tracking-tight text-white">
                    AdminBHSR
                  </span>
                </Link>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur">
                  {normalizedRole}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-3 text-white/85 sm:gap-4">
                <div className="flex flex-col text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  <span className="mb-1">Rol activo</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {normalizedRole}
                  </span>
                </div>
                <div className="hidden h-4 w-px bg-white/25 md:block" />
                <span className="text-xs font-medium text-white">
                  {session?.user?.name || session?.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H3m12 0l-4 4m4-4l-4-4m9 8V8a2 2 0 00-2-2h-3" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>

            <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm text-white/80 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'border-white bg-white text-brand-magentaDark shadow-sm'
                        : 'border-white/20 bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {guidance.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 text-white/85">
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      Guía rápida del rol
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-white">
                      Prioridades para {normalizedRole.toLowerCase()}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowGuidance((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/30"
                  >
                    {showGuidance ? 'Ocultar' : 'Mostrar'} detalles
                    <svg
                      className={`h-3 w-3 transition-transform ${showGuidance ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {showGuidance && (
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/90">
                    {guidance.map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="relative pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-brand-magenta/15 bg-white/95 p-6 shadow-xl shadow-brandSoft backdrop-blur">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Layout(props: LayoutProps) {
  return (
    <Suspense
      fallback={(
  <div className="flex min-h-screen items-center justify-center bg-[#fefbfe]">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-magenta border-t-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-plum/70">Cargando interfaz</p>
          </div>
        </div>
      )}
    >
      <LayoutShell {...props} />
    </Suspense>
  )
}
