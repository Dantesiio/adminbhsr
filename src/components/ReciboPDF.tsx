/**
 * ReciboPDF — PDF component rendered server-side with @react-pdf/renderer.
 * Used by GET /api/rq/[id]/recibo.pdf
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RQItem {
  id: string
  name: string
  spec?: string | null
  qty: number | { toString(): string }
  uom?: string | null
}

interface Receipt {
  status: string
  notes?: string | null
  createdAt: Date | string
}

interface Supplier {
  name: string
}

interface PO {
  number: string
  supplier: Supplier
  currency: string
  total: number | { toString(): string }
}

interface Project {
  name: string
}

interface RQData {
  code: string
  title: string
  status: string
  createdAt: Date | string
  items: RQItem[]
  receipts: Receipt[]
  po?: PO | null
  project: Project
  requester: { name?: string | null; email: string }
}

export interface ReciboPDFProps {
  rq: RQData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(spec?: string | null): number {
  if (!spec) return 0
  const m = spec.match(/Precio unitario:\s*\$([\d.,]+)/i)
  if (!m) return 0
  return parseFloat(m[1].replace(/\./g, '').replace(',', '.')) || 0
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MAGENTA = '#ec008c'
const PLUM = '#320a2b'
const LIGHT = '#ffe3f5'
const GRAY = '#6b7280'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: PLUM, padding: 40, backgroundColor: '#ffffff' },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logoBox: { width: 120 },
  logoTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: MAGENTA },
  logoSub: { fontSize: 7, color: GRAY, marginTop: 2 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: PLUM, textAlign: 'right' },
  docCode: { fontSize: 10, color: MAGENTA, textAlign: 'right', marginTop: 2 },
  // Divider
  divider: { height: 1.5, backgroundColor: MAGENTA, marginVertical: 12 },
  dividerLight: { height: 0.5, backgroundColor: '#e5e7eb', marginVertical: 8 },
  // Info grid
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 6, padding: 8 },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 9, color: PLUM },
  // Section title
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: MAGENTA, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  // Table
  table: { width: '100%', marginBottom: 8 },
  tableHead: { flexDirection: 'row', backgroundColor: PLUM, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 6 },
  tableHeadCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  tableRowAlt: { backgroundColor: '#fdf6fa' },
  tableCell: { fontSize: 8, color: PLUM },
  // Col widths
  colIdx: { width: '5%' },
  colDesc: { width: '38%' },
  colUom: { width: '12%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '17%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  // Totals
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 6, paddingHorizontal: 6 },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: PLUM, marginRight: 16 },
  totalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: MAGENTA },
  // Status badge
  statusBox: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  // Signatures
  sigRow: { flexDirection: 'row', gap: 20, marginTop: 32 },
  sigBox: { flex: 1, borderTopWidth: 1, borderTopColor: '#d1d5db', paddingTop: 6 },
  sigLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 7, color: GRAY, textAlign: 'center' },
})

// ─── Component ────────────────────────────────────────────────────────────────

export function ReciboPDF({ rq }: ReciboPDFProps) {
  const lastReceipt = rq.receipts[0]
  const items = rq.items

  const grandTotal = items.reduce((acc, item) => {
    const price = parsePrice(item.spec)
    return acc + price * Number(item.qty)
  }, 0)

  const fmtCOP = (v: number) =>
    `$${v.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

  const statusColors: Record<string, { bg: string; fg: string }> = {
    CONFORME:    { bg: '#dcfce7', fg: '#16a34a' },
    NO_CONFORME: { bg: '#fee2e2', fg: '#dc2626' },
    PENDIENTE:   { bg: '#fef9c3', fg: '#ca8a04' },
  }
  const receiptStatusColor = lastReceipt
    ? (statusColors[lastReceipt.status] ?? { bg: LIGHT, fg: MAGENTA })
    : null

  const generatedAt = new Date().toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Document
      title={`Recibo ${rq.code}`}
      author="AdminBHSR — Fundación Monte Tabor"
      subject="Recibo de recepción de bienes"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={s.logoBox}>
            <Text style={s.logoTitle}>AdminBHSR</Text>
            <Text style={s.logoSub}>Fundación Italocolombiana del Monte Tabor</Text>
            <Text style={s.logoSub}>NIT 900.168.662-2</Text>
            <Text style={s.logoSub}>Hospital San Rafael</Text>
          </View>
          <View>
            <Text style={s.docTitle}>RECIBO DE RECEPCIÓN</Text>
            <Text style={s.docCode}>{rq.code}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Info general ── */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Proyecto</Text>
            <Text style={s.infoValue}>{rq.project.name}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Solicitante</Text>
            <Text style={s.infoValue}>{rq.requester.name || rq.requester.email}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Fecha RQ</Text>
            <Text style={s.infoValue}>{fmtDate(rq.createdAt)}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Estado RQ</Text>
            <Text style={s.infoValue}>{rq.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {rq.po && (
          <View style={s.infoRow}>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>N° Orden de Compra</Text>
              <Text style={s.infoValue}>{rq.po.number}</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Proveedor</Text>
              <Text style={s.infoValue}>{rq.po.supplier.name}</Text>
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Total OC</Text>
              <Text style={s.infoValue}>{rq.po.currency} {Number(rq.po.total).toLocaleString('es-CO')}</Text>
            </View>
            <View style={{ flex: 1 }} />
          </View>
        )}

        <View style={s.dividerLight} />

        {/* ── Items ── */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Detalle de ítems</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadCell, s.colIdx]}>#</Text>
            <Text style={[s.tableHeadCell, s.colDesc]}>Descripción</Text>
            <Text style={[s.tableHeadCell, s.colUom]}>Unidad</Text>
            <Text style={[s.tableHeadCell, s.colQty]}>Cant.</Text>
            <Text style={[s.tableHeadCell, s.colPrice]}>P. Unit COP</Text>
            <Text style={[s.tableHeadCell, s.colTotal]}>Total COP</Text>
          </View>
          {items.map((item, idx) => {
            const price = parsePrice(item.spec)
            const rowTotal = price * Number(item.qty)
            const displaySpec = (item.spec || '').replace(/Precio unitario:\s*\$[\d.,]+(\s*·\s*)?/i, '').trim()
            return (
              <View key={item.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, s.colIdx]}>{idx + 1}</Text>
                <Text style={[s.tableCell, s.colDesc]}>
                  {item.name}
                  {displaySpec ? `\n${displaySpec}` : ''}
                </Text>
                <Text style={[s.tableCell, s.colUom]}>{item.uom || 'unidad'}</Text>
                <Text style={[s.tableCell, s.colQty]}>{Number(item.qty).toLocaleString('es-CO')}</Text>
                <Text style={[s.tableCell, s.colPrice]}>{price > 0 ? fmtCOP(price) : '—'}</Text>
                <Text style={[s.tableCell, s.colTotal]}>{rowTotal > 0 ? fmtCOP(rowTotal) : '—'}</Text>
              </View>
            )
          })}
        </View>

        {grandTotal > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total estimado (COP)</Text>
            <Text style={s.totalValue}>{fmtCOP(grandTotal)}</Text>
          </View>
        )}

        <View style={s.dividerLight} />

        {/* ── Estado de recepción ── */}
        {lastReceipt && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.sectionTitle}>Estado de recepción</Text>
            <View style={[s.statusBox, { backgroundColor: receiptStatusColor?.bg ?? LIGHT }]}>
              <Text style={[s.statusText, { color: receiptStatusColor?.fg ?? MAGENTA }]}>
                {lastReceipt.status.replace('_', ' ')} — {fmtDate(lastReceipt.createdAt)}
              </Text>
            </View>
            {lastReceipt.notes && (
              <Text style={{ fontSize: 8, color: GRAY, marginTop: 4 }}>
                Observaciones: {lastReceipt.notes}
              </Text>
            )}
          </View>
        )}

        {/* ── Firmas ── */}
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Recibido por</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Revisado por</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Aprobado por</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generado el {generatedAt} · AdminBHSR · Fundación Italocolombiana del Monte Tabor · NIT 900.168.662-2
          </Text>
        </View>

      </Page>
    </Document>
  )
}
