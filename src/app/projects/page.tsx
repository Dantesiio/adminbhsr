import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const totalProjects = projects.length
  const projectsWithClient = projects.filter((project) => project.client && project.client.trim().length > 0).length
  const latestProject = projects[0]
  const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

  return (
    <Layout currentRole="ADMIN">
      <div className="space-y-10">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Catálogo maestro</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Proyectos</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                Controla las iniciativas habilitadas para requisiciones y mantén actualizada la información comercial y financiera.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo proyecto
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Total proyectos</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalProjects}</p>
              <p className="mt-1 text-xs text-white/70">Activos en el sistema</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Con cliente asignado</p>
              <p className="mt-2 text-3xl font-bold text-white">{projectsWithClient}</p>
              <p className="mt-1 text-xs text-white/70">Proyectos con contacto registrado</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Último registrado</p>
              <p className="mt-2 text-lg font-semibold text-white">{latestProject ? latestProject.name : 'Sin registros'}</p>
              <p className="mt-1 text-xs text-white/70">
                {latestProject ? dateFormatter.format(latestProject.createdAt) : 'Agrega el primer proyecto para iniciar'}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Listado de proyectos</h2>
                <p className="text-sm text-slate-500">Consulta los proyectos autorizados para requisiciones y gestiona su información principal.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Creado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {projects.map((project) => (
                    <tr key={project.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{project.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{project.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{project.client || <span className="text-slate-400">Sin cliente</span>}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{dateFormatter.format(project.createdAt)}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <Link
                          href={`/projects/${project.id}/edit`}
                          className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h3.5a2 2 0 011.6.8l1.8 2.4a2 2 0 001.6.8H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-600">No hay proyectos registrados</p>
                          <p className="text-xs text-slate-500">Crea el primer proyecto para habilitar las requisiciones.</p>
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