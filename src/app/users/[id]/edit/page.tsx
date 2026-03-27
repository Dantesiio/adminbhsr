'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type User = { id: string; name: string | null; email: string; role: string }

const ROLES = [
  { value: 'SOLICITANTE', label: 'Solicitante',   desc: 'Crea y envía requisiciones de compra.' },
  { value: 'COMPRAS',     label: 'Compras',       desc: 'Gestiona cotizaciones y emite órdenes de compra.' },
  { value: 'AUTORIZADOR', label: 'Autorizador',   desc: 'Aprueba o rechaza requisiciones antes de la OC.' },
  { value: 'ADMIN',       label: 'Administrador', desc: 'Acceso total: usuarios, catálogos y configuración.' },
]

export default function EditUserPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('SOLICITANTE')
  const [changePassword, setChangePassword] = useState(false)

  useEffect(() => {
    fetch(`/api/users/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setUser(d.user ?? null); setSelectedRole(d.user?.role ?? 'SOLICITANTE') })
      .catch(() => setError('Error al cargar el usuario'))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      name:  (form.get('name') as string).trim() || null,
      email: (form.get('email') as string).trim(),
      role:  selectedRole,
    }

    if (changePassword) {
      const password = form.get('password') as string
      const confirm  = form.get('confirm')  as string
      if (password !== confirm) { setError('Las contraseñas no coinciden.'); setSaving(false); return }
      if (password.length < 8)  { setError('Mínimo 8 caracteres.'); setSaving(false); return }
      body.password = password
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); return }
      router.push('/users')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <Layout currentRole="ADMIN">
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">{error || 'Cargando…'}</div>
      </Layout>
    )
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
            <h1 className="text-lg font-semibold text-gray-900">Editar usuario</h1>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  name="name"
                  defaultValue={user.name ?? ''}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Cambio de contraseña */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={e => setChangePassword(e.target.checked)}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-gray-700">Cambiar contraseña</span>
              </label>
              {changePassword && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                    <input name="password" type="password" minLength={8} required placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                    <input name="confirm" type="password" required placeholder="Repite la contraseña"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                </div>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selectedRole === r.value ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selectedRole === r.value ? 'text-rose-700' : 'text-gray-900'}`}>{r.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/users" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </Link>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-60"
              >
                {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
