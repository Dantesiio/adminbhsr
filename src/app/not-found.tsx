import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
      <div className="w-full max-w-md text-center">
        {/* Code */}
        <p className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-brand-magenta to-brand-purple select-none">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-800">Página no encontrada</h1>
        <p className="mt-3 text-sm text-slate-500">
          Esta sección está en desarrollo o la dirección no existe.
          <br />Si crees que es un error, avisa al administrador.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir al Dashboard
          </Link>
          <Link
            href="/rq"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver Requisiciones
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-400">AdminBHSR · Sistema de Compras</p>
      </div>
    </div>
  )
}
