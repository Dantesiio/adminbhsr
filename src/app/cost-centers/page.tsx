import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CostCentersPage() {
  const costCenters = await prisma.costCenter.findMany({
    orderBy: { name: 'asc' },
  })

  const total = costCenters.length
  const active = costCenters.filter((cc) => cc.active).length
  const inactive = total - active

  return (
    <Layout currentRole="ADMIN">
      <div className="space-y-10">
        <header className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Gobernanza financiera</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Centros de costo</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                Mantén organizado el catálogo de centros de costo disponibles para requisiciones y controla su vigencia.
              </p>
            </div>
            <Link
              href="/cost-centers/new"
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow hover:shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo centro de costo
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Total centros</p>
              <p className="mt-2 text-3xl font-bold text-white">{total}</p>
              <p className="mt-1 text-xs text-white/70">Disponibles en el sistema</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Activos</p>
              <p className="mt-2 text-3xl font-bold text-white">{active}</p>
              <p className="mt-1 text-xs text-white/70">Listos para asociar a requisiciones</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Inactivos</p>
              <p className="mt-2 text-3xl font-bold text-white">{inactive}</p>
              <p className="mt-1 text-xs text-white/70">Requieren revisión o cierre</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Catálogo de centros</h2>
                <p className="text-sm text-slate-500">Revisa el estado de cada centro de costo y ejecuta ajustes operativos.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {costCenters.map((cc) => (
                    <tr key={cc.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{cc.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{cc.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            cc.active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${cc.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {cc.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <Link
                          href={`/cost-centers/${cc.id}/edit`}
                          className="inline-flex items-center gap-1 text-emerald-600 transition hover:text-emerald-800"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {costCenters.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m0-4V7a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-4-20v4m0 12v4m-7-9h4m8 0h4" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-600">No hay centros registrados</p>
                          <p className="text-xs text-slate-500">Crea un centro para habilitar requisiciones.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}