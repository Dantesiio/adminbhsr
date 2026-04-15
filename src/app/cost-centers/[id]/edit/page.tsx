'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type CostCenter = { id: string; code: string; name: string; active: boolean }

export default function EditCostCenterPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [cc, setCc] = useState<CostCenter | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/cost-centers/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCc(d.costCenter ?? null))
      .catch(() => setError('Error al cargar'))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body = {
      code:   (form.get('code') as string).trim(),
      name:   (form.get('name') as string).trim(),
      active: form.get('active') === 'true',
    }

    try {
      const res = await fetch(`/api/cost-centers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); return }
      router.push('/cost-centers')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (!cc) {
    return (
      <Layout currentRole="ADMIN">
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          {error || 'Cargando…'}
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentRole="ADMIN">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/cost-centers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Centros de costo
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h1 className="text-lg font-semibold text-gray-900">Editar centro de costo</h1>
            <p className="mt-1 text-sm text-gray-500">{cc.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Código <span className="text-red-500">*</span></label>
                <input
                  name="code"
                  required
                  defaultValue={cc.code}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  required
                  defaultValue={cc.name}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                name="active"
                defaultValue={String(cc.active)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="true">Activo — disponible para nuevas RQs</option>
                <option value="false">Inactivo — no aparece al crear RQs</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/cost-centers" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
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
