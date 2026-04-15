'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactNode, Suspense, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import type { AppRole } from '@/lib/roles'
import logoHorizontal from '@/lib/images/logo.svg.jpeg'

interface LayoutProps {
  readonly children: ReactNode
  readonly currentRole?: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: () => JSX.Element
  roles: AppRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard, roles: ['SOLICITANTE', 'COMPRAS', 'AUTORIZADOR', 'ADMIN', 'TESORERIA'] },
  { href: '/rq/new', label: 'Nueva RQ', icon: IconPlus, roles: ['SOLICITANTE', 'ADMIN'] },
  { href: '/rq/import', label: 'Importar RQ', icon: IconPlus, roles: ['SOLICITANTE', 'ADMIN'] },
  { href: '/rq', label: 'Requisiciones', icon: IconClipboard, roles: ['SOLICITANTE', 'COMPRAS', 'AUTORIZADOR', 'ADMIN', 'TESORERIA'] },
  { href: '/suppliers', label: 'Proveedores', icon: IconBuilding, roles: ['COMPRAS', 'ADMIN'] },
  { href: '/projects', label: 'Proyectos', icon: IconFolder, roles: ['ADMIN'] },
  { href: '/cost-centers', label: 'Centros de Costo', icon: IconTag, roles: ['ADMIN'] },
  { href: '/users', label: 'Usuarios', icon: IconUsers, roles: ['ADMIN'] },
]

const ROLE_LABELS: Record<AppRole, string> = {
  SOLICITANTE: 'Solicitante',
  COMPRAS: 'Compras',
  AUTORIZADOR: 'Autorizador',
  ADMIN: 'Administrador',
  TESORERIA: 'Tesorería',
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/rq/new': 'Nueva RQ',
  '/rq': 'Requisiciones',
  '/suppliers': 'Proveedores',
  '/projects': 'Proyectos',
  '/cost-centers': 'Centros de Costo',
  '/users': 'Usuarios',
  '/users/new': 'Nuevo usuario',
}

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  if (pathname.startsWith('/rq/import')) return 'Importar RQ'
  if (pathname.startsWith('/rq/') && pathname.endsWith('/recepcion')) return 'Recepción'
  if (pathname.startsWith('/rq/') && pathname.endsWith('/quotes')) return 'Cotizaciones'
  if (pathname.startsWith('/rq/') && pathname.endsWith('/approve')) return 'Aprobación'
  if (pathname.startsWith('/rq/') && pathname.endsWith('/oc')) return 'Emitir OC'
  if (pathname.startsWith('/rq/') && pathname.endsWith('/email-suppliers')) return 'Email Proveedores'
  if (pathname.startsWith('/rq/')) return 'Detalle RQ'
  return 'AdminBHSR'
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: AppRole
  pathname: string
  onClose?: () => void
}

function Sidebar({ role, pathname, onClose }: SidebarProps) {
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const dashboardHref = `/dashboard?role=${role}`

  return (
    <aside className="flex h-full w-60 flex-col bg-brand-plum">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link href={dashboardHref} className="flex items-center gap-3 group" onClick={onClose}>
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/15 p-1 transition group-hover:bg-white/25">
            <Image
              src={logoHorizontal}
              alt="Hospital San Rafael"
              className="h-full w-full object-contain"
              priority
              sizes="36px"
            />
          </span>
          <span className="text-base font-bold tracking-tight text-white">AdminBHSR</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white transition md:hidden">
            <IconX />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="mx-4 mb-2 rounded-lg bg-white/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">Rol activo</p>
        <p className="mt-0.5 text-xs font-semibold text-white">{ROLE_LABELS[role]}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const href = item.href === '/dashboard' ? dashboardHref : item.href
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-magenta text-white shadow-lg shadow-brand-magenta/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                    <Icon />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer version */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Image
            src={logoHorizontal}
            alt="Logo"
            className="h-5 w-5 rounded object-contain opacity-60"
            width={20}
            height={20}
          />
          <span className="text-[10px] text-white/40">Fundación Monte Tabor · v0.1</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

function LayoutShell({ children, currentRole: propRole }: LayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const appRoles: AppRole[] = ['SOLICITANTE', 'COMPRAS', 'AUTORIZADOR', 'ADMIN', 'TESORERIA']
  const rawRole = session?.user?.role || propRole || 'SOLICITANTE'
  const role: AppRole = appRoles.includes(rawRole as AppRole) ? (rawRole as AppRole) : 'SOLICITANTE'

  const breadcrumb = getBreadcrumb(pathname)
  const userName = session?.user?.name || session?.user?.email || 'Usuario'

  return (
    <div className="flex h-screen overflow-hidden bg-brand-sand">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar role={role} pathname={pathname} />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-brand-plum/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 flex w-60 flex-col shadow-2xl">
            <Sidebar role={role} pathname={pathname} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-brand-magenta/10 bg-white px-4 shadow-sm">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-brand-plum/60 hover:bg-brand-magentaLight hover:text-brand-magenta transition md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-brand-plum/40 sm:inline">AdminBHSR</span>
              <span className="hidden text-brand-plum/30 sm:inline">/</span>
              <span className="font-semibold text-brand-plum">{breadcrumb}</span>
            </div>
          </div>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs font-semibold text-brand-plum leading-tight">{userName}</span>
              <span className="text-[10px] text-brand-plum/50">{ROLE_LABELS[role]}</span>
            </div>
            <Avatar name={userName} />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 rounded-lg border border-brand-magenta/20 px-3 py-1.5 text-xs font-medium text-brand-plum/70 transition hover:border-brand-magenta hover:bg-brand-magentaLight hover:text-brand-magenta"
            >
              <IconLogout />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout(props: LayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-sand">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-magenta border-t-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-plum/60">
              Cargando…
            </p>
          </div>
        </div>
      }
    >
      <LayoutShell {...props} />
    </Suspense>
  )
}
