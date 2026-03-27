'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ROLES = [
  { value: 'SOLICITANTE', label: 'Solicitante', desc: 'Crea y envía requisiciones de compra.' },
  { value: 'COMPRAS',     label: 'Compras',     desc: 'Gestiona cotizaciones y emite órdenes de compra.' },
  { value: 'AUTORIZADOR', label: 'Autorizador', desc: 'Aprueba o rechaza requisiciones antes de la OC.' },
  { value: 'ADMIN',       label: 'Administrador', desc: 'Acceso total: usuarios, catálogos y configuración.' },
]

export default function NewUserPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('SOLICITANTE')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm  = form.get('confirm')  as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      setSaving(false)
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      setSaving(false)
      return
    }

    const body = {
      name:     (form.get('name')  as string).trim() || null,
      email:    (form.get('email') as string).trim(),
      password,
      role:     selectedRole,
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear usuario'); return }
      router.push('/users')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout currentRole="ADMIN">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Usuarios
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h1 className="text-lg font-semibold text-gray-900">Nuevo usuario</h1>
            <p className="mt-1 text-sm text-gray-500">El usuario podrá iniciar sesión con su email y contraseña.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Datos básicos */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  name="name"
                  placeholder="Ej. María García"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Selector de rol */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rol <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selectedRole === r.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selectedRole === r.value ? 'text-rose-700' : 'text-gray-900'}`}>
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/users" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-60"
              >
                {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
