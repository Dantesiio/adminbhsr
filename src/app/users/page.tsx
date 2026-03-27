import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  SOLICITANTE: { label: 'Solicitante',   className: 'bg-blue-100 text-blue-700' },
  COMPRAS:     { label: 'Compras',       className: 'bg-purple-100 text-purple-700' },
  AUTORIZADOR: { label: 'Autorizador',   className: 'bg-orange-100 text-orange-700' },
  ADMIN:       { label: 'Administrador', className: 'bg-rose-100 text-rose-700' },
}

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof prisma.user.findMany>> = []
  try {
    users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    // DB not available
  }

  const byRole = (r: string) => users.filter(u => u.role === r).length

  return (
    <Layout currentRole="ADMIN">
      <div className="space-y-8">

        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-rose-600 via-pink-500 to-fuchsia-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Administración</p>
              <h1 className="mt-2 text-3xl font-bold">Usuarios</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                Gestiona las cuentas del sistema y asigna roles según las responsabilidades de cada persona.
              </p>
            </div>
            <Link
              href="/users/new"
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-rose-700 shadow hover:shadow-lg transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo usuario
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(['SOLICITANTE','COMPRAS','AUTORIZADOR','ADMIN'] as const).map(role => (
              <div key={role} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">{ROLE_LABELS[role].label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{byRole(role)}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Listado de usuarios</h2>
            <p className="text-sm text-slate-500">Haz clic en Editar para cambiar el rol o la contraseña de un usuario.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map(user => {
                  const roleCfg = ROLE_LABELS[user.role] ?? { label: user.role, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 text-sm font-bold text-white">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleCfg.className}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-800 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
