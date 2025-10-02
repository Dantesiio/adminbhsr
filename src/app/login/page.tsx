'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Login Form */}
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Iniciar Sesión
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Hospital San Rafael - AdminBHSR
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="w-full max-w-md">
            <DemoCredentials />
          </div>
        </div>
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
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Credenciales de Prueba</h3>
      <p className="text-sm text-gray-600 mb-4">
        Usa la contraseña <code className="bg-gray-100 px-2 py-1 rounded text-xs">prueba123</code> para todos los roles:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {credentials.map((cred) => (
          <div key={cred.role} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">{cred.role}</div>
            <div className="text-sm text-blue-600 font-mono">{cred.email}</div>
            <div className="text-xs text-gray-500 mt-1">{cred.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}