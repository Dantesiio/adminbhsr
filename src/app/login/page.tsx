'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import logoHorizontal from '@/lib/images/logobhsr.png'
import logoEmblem from '@/lib/images/logo.svg.jpeg'

const highlights = [
  'Seguimiento completo del flujo de requisiciones',
  'Roles y permisos alineados a la operación del barco hospital',
  'Historial centralizado para compras, autorizaciones y logística',
]

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const from = useMemo(() => {
    const param = searchParams.get('from') || searchParams.get('callbackUrl') || '/'
    if (!param.startsWith('/')) {
      return '/'
    }
    if (param.startsWith('/login')) {
      return '/'
    }
    return param
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(from)
    }
  }, [status, from, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: from,
      })

      if (result?.error) {
        setError('Credenciales inválidas')
      } else {
        router.push(from)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-3xl border border-brand-magenta/15 bg-white text-brand-plum shadow-lg">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-brand-gradient/20" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-10 lg:p-12">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Image
                  src={logoHorizontal}
                  alt="Barco Hospital San Raffaele"
                  className="h-14 w-auto"
                  priority
                />
                <span className="hidden h-12 w-px bg-brand-magenta/10 sm:block" />
                <Image
                  src={logoEmblem}
                  alt="Fundación Italocolombiana del Monte Tabor"
                  className="h-14 w-auto rounded-2xl border border-brand-magenta/20 bg-white p-2"
                  priority
                />
              </div>
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-magenta/20 bg-brand-magenta/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-magentaDark">
                  AdminBHSR · Plataforma oficial
                </span>
                <h1 className="text-3xl font-semibold leading-snug text-brand-plum sm:text-4xl">
                  Gestiona requisiciones con la calidez del Barco Hospital San Raffaele
                </h1>
                <p className="max-w-xl text-sm text-brand-plum/70 sm:text-base">
                  Conecta equipos de compras, autorizaciones y logística en una sola interfaz pensada para la misión humanitaria del barco hospital.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-brand-plum/80 sm:text-base">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-magenta/15 text-[11px] font-semibold text-brand-magentaDark">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 rounded-2xl border border-brand-magenta/15 bg-brand-magenta/5 p-5 text-sm">
              <p className="font-semibold uppercase tracking-[0.28em] text-brand-magentaDark/70">Contacto</p>
              <p className="mt-2 text-brand-plum/70">
                ¿Necesitas credenciales o soporte? Escríbenos a{' '}
                <a href="mailto:sistemas@barcohospital.org" className="font-semibold text-brand-magentaDark underline decoration-brand-magenta/40 hover:decoration-brand-magenta">
                  sistemas@barcohospital.org
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-brandSoft lg:p-10">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-magenta/20 bg-brand-magenta/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-magentaDark">
                Acceso seguro
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-brand-plum">Iniciar sesión</h2>
              <p className="mt-2 text-sm text-brand-plum/70">Ingresa con tu correo institucional y contraseña asignada.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-brand-plum/80">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-brand-magenta/20 bg-brand-magenta/5 px-4 py-3 text-sm text-brand-plum shadow-sm transition focus:border-brand-magenta focus:outline-none focus:ring-2 focus:ring-brand-magenta/30"
                  placeholder="tu@barcohospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-brand-plum/80">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-xl border border-brand-magenta/20 bg-brand-magenta/5 px-4 py-3 text-sm text-brand-plum shadow-sm transition focus:border-brand-magenta focus:outline-none focus:ring-2 focus:ring-brand-magenta/30"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex w-full items-center justify-center rounded-xl bg-brand-magenta px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-magentaDark focus:outline-none focus:ring-2 focus:ring-brand-magenta/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando…
                  </div>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>
          </div>

          <DemoCredentials />
        </section>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function DemoCredentials() {
  const credentials = [
    { role: 'Solicitante', email: 'prueba@solicitante.com', description: 'Crear y gestionar RQs' },
    { role: 'Compras', email: 'prueba@compras.com', description: 'Cotizaciones y comparativos' },
    { role: 'Autorizador', email: 'prueba@autorizador.com', description: 'Aprobar requisiciones' },
    { role: 'Admin', email: 'prueba@admin.com', description: 'Configuración del sistema' },
  ]

  return (
    <div className="rounded-3xl border border-brand-magenta/15 bg-white/70 p-6 shadow-brandSoft backdrop-blur">
      <h3 className="text-lg font-semibold text-brand-plum">Credenciales de prueba</h3>
      <p className="mt-2 text-sm text-brand-plum/70">
        Usa la contraseña <code className="rounded bg-brand-magenta/10 px-2 py-1 text-xs font-semibold text-brand-magentaDark">prueba123</code> para todos los roles:
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {credentials.map((cred) => (
          <div
            key={cred.role}
            className="rounded-2xl border border-brand-magenta/15 bg-white px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-brandSoft"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-magentaDark/70">{cred.role}</div>
            <div className="mt-1 font-mono text-sm text-brand-magenta">{cred.email}</div>
            <div className="mt-2 text-xs text-brand-plum/60">{cred.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}