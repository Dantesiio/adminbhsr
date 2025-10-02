'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkflowTimeline } from '@/components/WorkflowTimeline'
import { getStageByStatus } from '@/lib/workflow'

interface RQItem {
  id: string
  name: string
  spec?: string
  qty: number
  uom?: string
}

interface RQ {
  id: string
  code: string
  title: string
  description?: string
  status: string
  items: RQItem[]
  project: {
    name: string
  }
}

interface Supplier {
  id: string
  name: string
  nit?: string
  email?: string
  phone?: string
}

interface Quote {
  id: string
  supplier?: {
    name: string
  }
  currency: string
  total?: number
  createdAt: string
  notes?: string
}

export default function RQQuotesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'COMPRAS'
  
  const [rq, setRQ] = useState<RQ | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddQuote, setShowAddQuote] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Mock data - in real implementation, this would come from API
      setRQ({
        id: params.id,
        code: 'RQ-0001',
        title: 'Compra de bolsas',
        description: 'Bolsas para proyecto ECHO',
        status: 'EN_COMPARATIVO',
        items: [
          { id: '1', name: 'Bolsa 20x30', spec: 'Polietileno', qty: 1000, uom: 'unidad' },
          { id: '2', name: 'Bolsa 30x40', spec: 'Polietileno', qty: 500, uom: 'unidad' },
        ],
        project: { name: 'ECHO Bolsas 06/2025' }
      })

      setSuppliers([
        { id: '1', name: 'Proveedor A', nit: '123456789', email: 'contacto@proveedora.com' },
        { id: '2', name: 'Proveedor B', nit: '987654321', email: 'ventas@proveedorb.com' },
        { id: '3', name: 'Proveedor C', nit: '456789123', email: 'cotizaciones@proveedorc.com' },
      ])

      setQuotes([])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateComparison = () => {
    if (quotes.length < 2) {
      alert('Se necesitan al menos 2 cotizaciones para crear un comparativo')
      return
    }
    
    // In real implementation, this would call an API
    alert('Comparativo creado exitosamente')
    router.push(`/rq/${params.id}?role=${role}`)
  }

  if (loading) {
    return (
      <Layout currentRole={role}>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </Layout>
    )
  }

  if (!rq) {
    return (
      <Layout currentRole={role}>
        <div className="text-center text-gray-500">RQ no encontrada</div>
      </Layout>
    )
  }

  const currentStage = getStageByStatus(rq.status)

  return (
    <Layout currentRole={role}>
      <div className="space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Compras</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Gestionar Cotizaciones</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {rq.code} • {rq.project.name}
              </p>
              {currentStage && (
                <p className="mt-1 text-xs text-white/70 max-w-xl">
                  {currentStage.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddQuote(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow hover:shadow-lg"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Solicitar Cotización
              </button>
              {quotes.length >= 2 && (
                <button
                  onClick={handleCreateComparison}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 6H7a2 2 0 01-2-2V8a2 2 0 012-2h5l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2z" />
                  </svg>
                  Crear Comparativo
                </button>
              )}
            </div>
          </div>
          <div className="mt-6">
            <WorkflowTimeline currentStatus={rq.status} compact />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* RQ Items Summary */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Ítems a Cotizar</h2>
              <p className="mt-1 text-xs text-slate-500">Valida cantidades y especificaciones antes de solicitar al proveedor.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Especificación</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rq.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.spec || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.uom || 'unidad'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Cotizaciones Recibidas</h2>
                  <p className="text-xs text-slate-500">Registra mínimo dos para habilitar el comparativo.</p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {quotes.length} recibidas
                </div>
              </div>
              {quotes.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center text-sm text-blue-700">
                  Aún no se registran cotizaciones. Usa el botón &quot;Solicitar Cotización&quot; para comenzar.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{quote.supplier?.name}</h3>
                          {quote.notes && <p className="mt-1 text-xs text-slate-600">{quote.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {quote.currency} {quote.total?.toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-slate-500">Recibida {new Date(quote.createdAt).toLocaleDateString('es-CO')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-700">Checklist del comprador</h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirma que los proveedores recibieron la solicitud.
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Revisa que los precios incluyan impuestos y condiciones de entrega.
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Adjunta documentos o certificaciones entregados por el proveedor.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Proveedores disponibles</h3>
              <div className="mt-3 space-y-3">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{supplier.name}</p>
                    <p className="text-xs text-slate-500">{supplier.email || 'Sin correo'} • {supplier.phone || 'Sin teléfono'}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* Request Quote Modal */}
        {showAddQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Solicitar Cotización</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="quoteSupplier" className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Proveedor
                  </label>
                  <select id="quoteSupplier" className="w-full border rounded-md px-3 py-2">
                    <option value="">Seleccione un proveedor...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.nit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="quoteNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    id="quoteNotes"
                    className="w-full border rounded-md px-3 py-2 rows-3"
                    placeholder="Notas para el proveedor..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddQuote(false)}
                  className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert('Solicitud de cotización enviada')
                    setShowAddQuote(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
