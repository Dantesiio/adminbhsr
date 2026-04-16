import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RQPDFProps {
  rq: {
    consecutivo?: string | null
    createdAt: Date | string
    description?: string | null
    direccionEntrega?: string | null
    moneda?: string | null
    financiador?: string | null
    code: string
    title: string
    requester: { name?: string | null }
    project: { name: string }
    items: Array<{
      spec?: string | null
      name: string
      descripcion?: string | null
      comentario?: string | null
      uom?: string | null
      qty: number | string
      precioEstimado?: number | string | null
      compraLocal?: boolean
      compraInternacional?: boolean
    }>
  }
  logoBase64?: string
  euroRate?: number
  usdRate?: number
  ivaRate?: number
}

// ─── Number formatter (Colombian locale, no Intl) ────────────────────────────

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

const styles = StyleSheet.create({
  page: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    padding: 15,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  logoArea: {
    flex: 1,
    flexDirection: 'column',
  },
  logoImage: {
    width: 110,
    height: 44,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PINK,
  },
  logoAddress: {
    fontSize: 5,
    color: '#555555',
    marginTop: 3,
  },
  consecutivoBox: {
    width: 200,
    borderWidth: 1,
    borderColor: BLACK,
  },
  consecutivoLabelRow: {
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
    paddingVertical: 3,
    alignItems: 'center',
  },
  consecutivoLabelText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  consecutivoValueRow: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  consecutivoValueText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
  },

  // ── Info table ───────────────────────────────────────────────────────────────
  infoTable: {
    borderWidth: 1,
    borderColor: BLACK,
    marginBottom: 4,
  },
  infoTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
  },
  infoTableRowLast: {
    flexDirection: 'row',
  },
  infoCell: {
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    paddingVertical: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  infoCellLast: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  infoCellLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  infoCellValue: {
    fontSize: 5.5,
    color: BLACK,
  },

  // ── Items table ──────────────────────────────────────────────────────────────
  itemsTable: {
    borderWidth: 1,
    borderColor: BLACK,
    marginBottom: 4,
  },
  groupHeaderRow: {
    flexDirection: 'row',
  },
  groupHeaderLeft: {
    flex: 8,
    backgroundColor: '#333333',
    borderRightWidth: 1,
    borderRightColor: BLACK,
    paddingVertical: 3,
    alignItems: 'center',
  },
  groupHeaderRight: {
    flex: 5,
    backgroundColor: '#333333',
    paddingVertical: 3,
    alignItems: 'center',
  },
  groupHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
  },
  th: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    color: '#222222',
  },
  thLast: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    padding: 2,
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
  td: {
    fontSize: 5.5,
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#CCCCCC',
    color: '#333333',
  },
  tdRight: {
    fontSize: 5.5,
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#CCCCCC',
    color: '#333333',
    textAlign: 'right',
  },
  tdLast: {
    fontSize: 5.5,
    padding: 2,
    color: '#333333',
  },
  tdSub: {
    fontSize: 4.5,
    color: '#666666',
    marginTop: 1,
  },

  // Column widths (12 cols, approx [45,155,40,40,40,60,60,40,45,40,55,55] = ~675)
  c1:  { width: 45 },
  c3:  { width: 155 },
  c4:  { width: 40 },
  c5:  { width: 40 },
  c6:  { width: 40 },
  c7:  { width: 60 },
  c8:  { width: 60 },
  c9:  { width: 40 },
  c10: { width: 45 },
  c11: { width: 40 },
  c12: { width: 55 },
  c13: { width: 55 },

  // ── Bottom section ───────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  bottomLeft: {
    flex: 6,
    borderWidth: 1,
    borderColor: BLACK,
  },
  bottomRight: {
    flex: 4,
    borderWidth: 1,
    borderColor: BLACK,
  },
  bottomLeftRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
  },
  bottomLeftRowLast: {
    flexDirection: 'row',
  },
  bottomLabelCell: {
    width: 80,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    paddingVertical: 3,
    paddingHorizontal: 3,
    backgroundColor: LIGHT_GRAY,
  },
  bottomLabelText: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  bottomValueCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  bottomValueText: {
    fontSize: 5.5,
    color: BLACK,
  },
  bottomFullRow: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
  },
  bottomFullText: {
    fontSize: 5.5,
    color: BLACK,
  },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  totalRowLast: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  totalAmount: {
    flex: 1,
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: BLACK,
  },
  totalLabel: {
    width: 70,
    fontSize: 5.5,
    color: '#333333',
    textAlign: 'right',
  },

  // ── Note ─────────────────────────────────────────────────────────────────────
  noteText: {
    fontSize: 5,
    color: '#666666',
    marginBottom: 3,
    fontStyle: 'italic',
  },

  // ── Umbral row ───────────────────────────────────────────────────────────────
  umbralRow: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: BLACK,
    marginBottom: 4,
  },
  umbralCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    alignItems: 'center',
  },
  umbralCellLast: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  umbralText: {
    fontSize: 5.5,
    color: '#444444',
    textAlign: 'center',
  },

  // ── Signature block ───────────────────────────────────────────────────────────
  signatureHeaderRow: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: BLACK,
    borderBottomWidth: 0,
  },
  signatureBaseRow: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: BLACK,
  },
  sigCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    minHeight: 30,
    backgroundColor: LIGHT_GRAY,
  },
  sigCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 30,
    backgroundColor: LIGHT_GRAY,
  },
  sigCellBase: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: BLACK,
    minHeight: 25,
  },
  sigCellBaseLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 25,
  },
  sigHeaderText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
  },
  sigBaseText: {
    fontSize: 6,
    color: '#333333',
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

export function RQPDF({ rq, logoBase64, euroRate = 4219.38, usdRate = 3674.14, ivaRate = 0 }: RQPDFProps) {
  const moneda = rq.moneda || 'COP'

  const items = rq.items.map((item) => {
    const qty = Number(item.qty) || 0
    const precio = Number(item.precioEstimado) || 0
    return { ...item, qty, precioEstimado: precio, precioTotal: qty * precio }
  })

  const subtotal = items.reduce((s, i) => s + i.precioTotal, 0)
  const ivaAmount = subtotal * (ivaRate / 100)
  const total = subtotal + ivaAmount
  const totalEuro = total / euroRate
  const totalUsd = total / usdRate

  const UMBRAL_LABELS = [
    'Umbral 1 - Compra directa: sí / no',
    'Umbral 2 - Lista de 3 precios',
    'Umbral 3 - 3 presupuestos: sí / no',
    'Umbral 4 - 4 presupuestos: sí / no',
    'Umbral 5 - licitación: sí /',
    'Exención: sí / no',
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        {/* ══ 1. HEADER ROW ══ */}
        <View style={styles.headerRow}>
          {/* Left: logo + address */}
          <View style={styles.logoArea}>
            {logoBase64 ? (
              <Image src={logoBase64} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoPlaceholder}>Barco Hospital San Raffaele</Text>
            )}
            <Text style={styles.logoAddress}>
              Avenida 4 Norte No. 26N-62 | Cel: 3167541354 | Nit: 900.168.662-2
            </Text>
          </View>

          {/* Right: consecutivo box */}
          <View style={styles.consecutivoBox}>
            <View style={styles.consecutivoLabelRow}>
              <Text style={styles.consecutivoLabelText}>Consecutivo No.</Text>
            </View>
            <View style={styles.consecutivoValueRow}>
              <Text style={styles.consecutivoValueText}>{rq.consecutivo || rq.code}</Text>
            </View>
          </View>
        </View>

        {/* ══ 2. INFO TABLE ══ */}
        {/*
          Column widths approx: [100, 90, 130, 70, 55, 55, 90, 90] = 680
          Fitting in landscape page minus 30pt margins = ~810pt available
        */}
        <View style={styles.infoTable}>
          {/* Row 1 */}
          <View style={styles.infoTableRow}>
            <View style={[styles.infoCell, { width: 100 }]}>
              <Text style={styles.infoCellLabel}>Fecha de solicitud</Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellValue}>{fmtDate(rq.createdAt)}</Text>
            </View>
            <View style={[styles.infoCell, { width: 130 }]}>
              <Text style={styles.infoCellLabel}>Fecha de fin de contrato con financiadora</Text>
            </View>
            <View style={[styles.infoCell, { width: 70 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellLabel}>Fecha de entrega efectiva</Text>
            </View>
            <View style={[styles.infoCellLast, { flex: 1 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.infoTableRow}>
            <View style={[styles.infoCell, { width: 100 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 130 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 70 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellLabel}>EURO</Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellLabel}>DÓLAR</Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCellLast, { flex: 1 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.infoTableRowLast}>
            <View style={[styles.infoCell, { width: 100 }]}>
              <Text style={styles.infoCellLabel}>Fecha de entrega deseada</Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellValue}></Text>
            </View>
            <View style={[styles.infoCell, { width: 130 }]}>
              <Text style={styles.infoCellLabel}>Moneda</Text>
            </View>
            <View style={[styles.infoCell, { width: 70 }]}>
              <Text style={styles.infoCellValue}>{moneda}</Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellValue}>{fmt(euroRate)}</Text>
            </View>
            <View style={[styles.infoCell, { width: 55 }]}>
              <Text style={styles.infoCellValue}>{fmt(usdRate)}</Text>
            </View>
            <View style={[styles.infoCell, { width: 90 }]}>
              <Text style={styles.infoCellLabel}>Financiador</Text>
            </View>
            <View style={[styles.infoCellLast, { flex: 1 }]}>
              <Text style={styles.infoCellValue}>{rq.financiador || ''}</Text>
            </View>
          </View>
        </View>

        {/* ══ 3. ITEMS TABLE ══ */}
        <View style={styles.itemsTable}>
          {/* Group header row */}
          <View style={styles.groupHeaderRow}>
            <View style={[styles.groupHeaderLeft, { width: 440 }]}>
              <Text style={styles.groupHeaderText}>Proceso de compra</Text>
            </View>
            <View style={[styles.groupHeaderRight, { flex: 1 }]}>
              <Text style={styles.groupHeaderText}>Logística</Text>
            </View>
          </View>

          {/* Column headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.c1]}>Línea de proyecto</Text>
            <Text style={[styles.th, styles.c3]}>Descripción</Text>
            <Text style={[styles.th, styles.c4]}>Unidad de manejo</Text>
            <Text style={[styles.th, styles.c5]}>PRESENTACION</Text>
            <Text style={[styles.th, styles.c6]}>Cantidad solicitada por unidades</Text>
            <Text style={[styles.th, styles.c7]}>Precio por unidad</Text>
            <Text style={[styles.th, styles.c8]}>Precio total en moneda</Text>
            <Text style={[styles.th, styles.c9]}>Compra local *</Text>
            <Text style={[styles.th, styles.c10]}>Compra internacional *</Text>
            <Text style={[styles.th, styles.c11]}>Contrato marco</Text>
            <Text style={[styles.th, styles.c12]}>Referencia de transporte si es necesario</Text>
            <Text style={[styles.thLast, styles.c13]}>Comentarios</Text>
          </View>

          {/* Item rows */}
          {items.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.td, styles.c1]}>{item.spec || ''}</Text>
              <View style={[styles.td, styles.c3]}>
                <Text style={{ fontSize: 5.5, color: '#333333' }}>{item.name}</Text>
                {item.descripcion ? <Text style={styles.tdSub}>{item.descripcion}</Text> : null}
              </View>
              <Text style={[styles.td, styles.c4]}>{item.uom || ''}</Text>
              <Text style={[styles.td, styles.c5]}></Text>
              <Text style={[styles.tdRight, styles.c6]}>{item.qty}</Text>
              <Text style={[styles.tdRight, styles.c7]}>
                {item.precioEstimado > 0 ? fmt(item.precioEstimado) : ''}
              </Text>
              <Text style={[styles.tdRight, styles.c8]}>
                {item.precioTotal > 0 ? fmt(item.precioTotal) : ''}
              </Text>
              <Text style={[styles.td, styles.c9]}>{item.compraLocal ? 'X' : ''}</Text>
              <Text style={[styles.td, styles.c10]}>{item.compraInternacional ? 'X' : ''}</Text>
              <Text style={[styles.td, styles.c11]}></Text>
              <Text style={[styles.td, styles.c12]}></Text>
              <Text style={[styles.tdLast, styles.c13]}>{item.comentario || ''}</Text>
            </View>
          ))}
        </View>

        {/* ══ 4. BOTTOM SECTION ══ */}
        <View style={styles.bottomRow}>
          {/* Left column */}
          <View style={styles.bottomLeft}>
            <View style={styles.bottomLeftRow}>
              <View style={styles.bottomLabelCell}>
                <Text style={styles.bottomLabelText}>Comentarios</Text>
              </View>
              <View style={styles.bottomValueCell}>
                <Text style={styles.bottomValueText}>{rq.description || ''}</Text>
              </View>
            </View>
            <View style={styles.bottomLeftRow}>
              <View style={styles.bottomLabelCell}>
                <Text style={styles.bottomLabelText}>Dirección de entrega</Text>
              </View>
              <View style={styles.bottomValueCell}>
                <Text style={styles.bottomValueText}>{rq.direccionEntrega || ''}</Text>
              </View>
            </View>
            <View style={styles.bottomFullRow}>
              <Text style={styles.bottomFullText}></Text>
            </View>
            <View style={styles.bottomFullRow}>
              <Text style={styles.bottomFullText}>{rq.direccionEntrega || ''}</Text>
            </View>
            <View style={[styles.bottomFullRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.bottomLabelText, { textDecoration: 'underline' }]}>
                Procedimiento requerido para efectuar las compras
              </Text>
            </View>
          </View>

          {/* Right column — totals */}
          <View style={styles.bottomRight}>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>$ {fmt(subtotal)}</Text>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>$ {fmt(0)}</Text>
              <Text style={styles.totalLabel}>GASTOS DE TRAN</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>$ {ivaAmount > 0 ? fmt(ivaAmount) : ''}</Text>
              <Text style={styles.totalLabel}>IVA {ivaRate > 0 ? `${ivaRate}%` : ''}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>$ {fmt(total)}</Text>
              <Text style={styles.totalLabel}>TOTAL en moneda</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>$ {fmt(totalEuro)}</Text>
              <Text style={styles.totalLabel}>TOTAL en euros</Text>
            </View>
            <View style={styles.totalRowLast}>
              <Text style={styles.totalAmount}>$ {fmt(totalUsd)}</Text>
              <Text style={styles.totalLabel}>TOTAL en USD</Text>
            </View>
          </View>
        </View>

        {/* ══ Note ══ */}
        <Text style={styles.noteText}>
          * Por favor, añada una cruz delante de la línea correspondiente a una de las opciones: Compra local, Compra internacional, Acuerdo marco
        </Text>

        {/* ══ 5. UMBRAL ROW ══ */}
        <View style={styles.umbralRow}>
          {UMBRAL_LABELS.map((label, i) => (
            <View
              key={i}
              style={i === UMBRAL_LABELS.length - 1 ? styles.umbralCellLast : styles.umbralCell}
            >
              <Text style={styles.umbralText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ══ 6. SIGNATURE HEADER ROW ══ */}
        <View style={styles.signatureHeaderRow}>
          {[
            'SOLICITANTE (nombre, firma y fecha)',
            'OFICIAL DE COMPRAS (nombre, firma y fecha)',
            'RESPONSABLE FINANCIERO (nombre firma)',
            'COORDINADOR PROYECTO (nombre firma y fecha)',
          ].map((title, i) => (
            <View
              key={i}
              style={i === 3 ? styles.sigCellLast : styles.sigCell}
            >
              <Text style={styles.sigHeaderText}>{title}</Text>
            </View>
          ))}
        </View>

        {/* ══ 7. BASE ROW ══ */}
        <View style={styles.signatureBaseRow}>
          <View style={styles.sigCellBase}>
            <Text style={styles.sigBaseText}>{rq.requester.name || ''}</Text>
          </View>
          <View style={styles.sigCellBase}>
            <Text style={styles.sigBaseText}></Text>
          </View>
          <View style={styles.sigCellBase}>
            <Text style={styles.sigBaseText}></Text>
          </View>
          <View style={styles.sigCellBaseLast}>
            <Text style={styles.sigBaseText}></Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
