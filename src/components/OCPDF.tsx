/**
 * OCPDF — Orden de Compra PDF rendered server-side with @react-pdf/renderer.
 * Used by GET /api/rq/[id]/oc.pdf
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OCPDFProps {
  po: {
    number: string
    createdAt: Date | string
    total: number
    condicionEntrega?: string | null
    condicionPago?: string | null
    notasImportantes?: string | null
    rq: {
      consecutivo?: string | null
      financiador?: string | null
      title: string
      items: Array<{
        spec?: string | null
        name: string
        uom?: string | null
        qty: number
        precioEstimado?: number | null
      }>
    }
    supplier: {
      name: string
      nit?: string | null
      email?: string | null
      phone?: string | null
    }
  }
  logoBase64?: string
  euroRate?: number
  usdRate?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.join(',')
}

function fmtDate(d: Date | string): string {
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const PINK = '#D4006A'
const BLACK = '#000000'
const LIGHT_GRAY = '#f5f5f5'

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: BLACK,
    padding: 20,
    backgroundColor: '#ffffff',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logoArea: {
    width: 160,
    flexDirection: 'column',
  },
  logoImage: {
    width: 130,
    height: 52,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PINK,
  },
  logoAddress: {
    fontSize: 6,
    color: '#555555',
    marginTop: 3,
  },
  headerSpacer: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    textAlign: 'right',
  },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: BLACK,
    marginVertical: 6,
  },

  // ── Consecutivo row ─────────────────────────────────────────────────────────
  consecRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BLACK,
    marginBottom: 6,
  },
  consecCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  consecCellLast: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  consecLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  consecValue: {
    fontSize: 7,
    color: BLACK,
  },

  // ── Two-box row ─────────────────────────────────────────────────────────────
  twoBoxRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BLACK,
    borderRadius: 3,
    padding: 6,
  },
  partyTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    textDecoration: 'underline',
    marginBottom: 4,
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    width: 80,
  },
  partyValue: {
    fontSize: 7,
    color: BLACK,
    flex: 1,
  },

  // ── Items table ──────────────────────────────────────────────────────────────
  table: {
    borderWidth: 1,
    borderColor: BLACK,
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    color: '#222222',
  },
  thLast: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: 3,
    color: '#222222',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
    backgroundColor: LIGHT_GRAY,
  },
  tableRowTotal: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BLACK,
    backgroundColor: '#ffe0f0',
  },
  td: {
    fontSize: 7,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: '#CCCCCC',
    color: '#333333',
  },
  tdRight: {
    fontSize: 7,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: '#CCCCCC',
    color: '#333333',
    textAlign: 'right',
  },
  tdLast: {
    fontSize: 7,
    padding: 3,
    color: '#333333',
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  // col widths
  cLinea: { width: 60 },
  cDesc:  { flex: 1 },
  cUom:   { width: 70 },
  cQty:   { width: 50 },
  cIva:   { width: 40 },
  cUnit:  { width: 80 },
  cTotal: { width: 80 },

  // ── Bottom section ───────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomLeft: {
    flex: 6,
  },
  bottomRight: {
    flex: 4,
  },
  condLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    color: BLACK,
    marginBottom: 2,
    marginTop: 5,
  },
  condValue: {
    fontSize: 7,
    color: '#333333',
    marginBottom: 4,
  },
  refText: {
    fontSize: 6,
    color: '#666666',
    marginTop: 8,
  },

  // Deductions box
  deductBox: {
    borderWidth: 1,
    borderColor: BLACK,
    marginBottom: 4,
  },
  deductRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
  },
  deductRowLast: {
    flexDirection: 'row',
  },
  deductLabel: {
    flex: 1,
    fontSize: 7,
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    color: '#333333',
  },
  deductValue: {
    width: 80,
    fontSize: 7,
    padding: 2,
    color: BLACK,
    textAlign: 'right',
  },

  // Totals
  totRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: BLACK,
    borderTopWidth: 0,
  },
  totRowFirst: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: BLACK,
    borderBottomWidth: 0,
  },
  totLabel: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
  },
  totValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PINK,
    textAlign: 'right',
    minWidth: 80,
  },

  // Watermark
  watermark: {
    position: 'absolute',
    top: 350,
    left: 150,
    fontSize: 80,
    color: '#f0f0f0',
    fontFamily: 'Helvetica-Bold',
    opacity: 0.15,
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

export function OCPDF({ po, logoBase64, euroRate = 4219.38, usdRate = 3674.14 }: OCPDFProps) {
  const items = po.rq.items
  const total = po.total || items.reduce((acc, i) => acc + (Number(i.qty) * Number(i.precioEstimado || 0)), 0)
  const totalEuro = total / euroRate
  const totalUsd = total / usdRate

  const consecutivoDisplay = [po.rq.financiador, po.rq.consecutivo].filter(Boolean).join(' - ')

  return (
    <Document title={`OC ${po.number}`} author="AdminBHSR — Fundación Monte Tabor" subject="Orden de Compra">
      <Page size="A4" style={s.page}>

        {/* Watermark */}
        <Text style={s.watermark}>Página 1</Text>

        {/* ══ 1. HEADER ══ */}
        <View style={s.headerRow}>
          <View style={s.logoArea}>
            {logoBase64 ? (
              <Image src={logoBase64} style={s.logoImage} />
            ) : (
              <Text style={s.logoPlaceholder}>BARCO HOSPITAL SAN RAFFAELE</Text>
            )}
            <Text style={s.logoAddress}>Avenida 4 Norte No. 26N-62</Text>
            <Text style={s.logoAddress}>Cel: 3167541354</Text>
            <Text style={s.logoAddress}>Nit: 900.168.662-2</Text>
          </View>
          <View style={s.headerSpacer} />
          <Text style={s.docTitle}>ORDEN DE COMPRAS</Text>
        </View>

        {/* ══ 2. SEPARATOR ══ */}
        <View style={s.divider} />

        {/* ══ 3. CONSECUTIVO ROW ══ */}
        <View style={s.consecRow}>
          <View style={s.consecCell}>
            <Text style={s.consecLabel}>Consecutivo No.</Text>
          </View>
          <View style={s.consecCell}>
            <Text style={s.consecValue}>{consecutivoDisplay || po.number}</Text>
          </View>
          <View style={s.consecCell}>
            <Text style={s.consecLabel}>Fecha</Text>
          </View>
          <View style={s.consecCellLast}>
            <Text style={s.consecValue}>{fmtDate(po.createdAt)}</Text>
          </View>
        </View>

        {/* ══ 4. TWO-BOX ROW ══ */}
        <View style={s.twoBoxRow}>
          {/* Proveedor */}
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>PROVEEDOR</Text>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Nit:</Text>
              <Text style={s.partyValue}>{po.supplier.nit || ''}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Nombre:</Text>
              <Text style={s.partyValue}>{po.supplier.name}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Dirección:</Text>
              <Text style={s.partyValue}></Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Ciudad:</Text>
              <Text style={s.partyValue}></Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Persona de referencia No:</Text>
              <Text style={s.partyValue}></Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Tel:</Text>
              <Text style={s.partyValue}>{po.supplier.phone || ''}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Mail:</Text>
              <Text style={s.partyValue}>{po.supplier.email || ''}</Text>
            </View>
          </View>

          {/* Comprador */}
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>COMPRADOR</Text>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Nombre:</Text>
              <Text style={s.partyValue}>FUNDACIÓN ITALOCOLOMBIANA DEL MONTE TABOR</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Nit:</Text>
              <Text style={s.partyValue}>900.168.662-2</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Dirección:</Text>
              <Text style={s.partyValue}>Avenida 4N #26N- 62 Barrio San Vicente</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Ciudad:</Text>
              <Text style={s.partyValue}>CALI, VALLE</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Persona de Referencia:</Text>
              <Text style={s.partyValue}>Diana Hernandez</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Contacto:</Text>
              <Text style={s.partyValue}>Celular 3167541354</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Mail:</Text>
              <Text style={s.partyValue}>asistentedecompras@barcohospitalhsr.org</Text>
            </View>
          </View>
        </View>

        {/* ══ 5. ITEMS TABLE ══ */}
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.th, s.cLinea]}>Line de proyecto</Text>
            <Text style={[s.th, s.cDesc]}>Descripción</Text>
            <Text style={[s.th, s.cUom]}>unidad de manejo</Text>
            <Text style={[s.th, s.cQty]}>Cantidad</Text>
            <Text style={[s.th, s.cIva]}>IVA%</Text>
            <Text style={[s.th, s.cUnit]}>VR. UNITARIO</Text>
            <Text style={[s.thLast, s.cTotal]}>VR. TOTAL Pesos</Text>
          </View>

          {items.map((item, idx) => {
            const qty = Number(item.qty) || 0
            const precio = Number(item.precioEstimado) || 0
            const rowTotal = qty * precio
            return (
              <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.td, s.cLinea]}>{item.spec || ''}</Text>
                <Text style={[s.td, s.cDesc]}>{item.name}</Text>
                <Text style={[s.td, s.cUom]}>{item.uom || ''}</Text>
                <Text style={[s.tdRight, s.cQty]}>{qty}</Text>
                <Text style={[s.td, s.cIva]}></Text>
                <Text style={[s.tdRight, s.cUnit]}>{precio > 0 ? fmt(precio) : ''}</Text>
                <Text style={[s.tdLast, s.cTotal]}>{rowTotal > 0 ? fmt(rowTotal) : ''}</Text>
              </View>
            )
          })}

          {/* Total row */}
          <View style={s.tableRowTotal}>
            <Text style={[s.td, s.cLinea]}></Text>
            <Text style={[s.td, s.cDesc]}></Text>
            <Text style={[s.td, s.cUom]}></Text>
            <Text style={[s.tdRight, s.cQty]}></Text>
            <Text style={[s.td, s.cIva]}></Text>
            <Text style={[s.tdRight, s.cUnit, { fontFamily: 'Helvetica-Bold' }]}>TOTAL</Text>
            <Text style={[s.tdLast, s.cTotal, { color: PINK }]}>$ {fmt(total)}</Text>
          </View>
        </View>

        {/* ══ 6. BOTTOM SECTION ══ */}
        <View style={s.bottomRow}>
          {/* Left column */}
          <View style={s.bottomLeft}>
            <Text style={s.condLabel}>CONDICION DE ENTREGA:</Text>
            <Text style={s.condValue}>{po.condicionEntrega || ''}</Text>

            <Text style={s.condLabel}>CONDICIONES DE PAGO</Text>
            <Text style={s.condValue}>{po.condicionPago || ''}</Text>

            <Text style={s.condLabel}>NOTAS IMPORTANTE</Text>
            <Text style={s.condValue}>{po.notasImportantes || ''}</Text>

            <Text style={s.refText}>{po.rq.title}</Text>
          </View>

          {/* Right column */}
          <View style={s.bottomRight}>
            {/* Deductions box */}
            <View style={s.deductBox}>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}>(-) Descuento</Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}>(+) IVA</Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}>(+) Costo de transporte</Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}>(-) Rtelte (-)%</Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}>(-) Reteica (-)%</Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRow}>
                <Text style={s.deductLabel}></Text>
                <Text style={s.deductValue}></Text>
              </View>
              <View style={s.deductRowLast}>
                <Text style={s.deductLabel}>Consignacion Exp.</Text>
                <Text style={s.deductValue}></Text>
              </View>
            </View>

            {/* Totals */}
            <View style={s.totRowFirst}>
              <Text style={s.totLabel}>TOT. ORDER</Text>
              <Text style={s.totValue}>$ {fmt(total)}</Text>
            </View>
            <View style={s.totRow}>
              <Text style={s.totLabel}>TOT. EURO</Text>
              <Text style={s.totValue}>$ {fmt(totalEuro)}</Text>
            </View>
            <View style={s.totRow}>
              <Text style={s.totLabel}>TOT. USD</Text>
              <Text style={s.totValue}>$ {fmt(totalUsd)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
