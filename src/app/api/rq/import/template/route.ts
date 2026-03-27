import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * GET /api/rq/import/template
 *
 * Generates and downloads a blank RQ Excel template with the correct
 * column structure expected by the import parser.
 */
export async function GET() {
  const workbook = XLSX.utils.book_new()

  // Metadata rows (mimic the real format)
  const metaRows: (string | number | null)[][] = [
    ['Fundación Italocolombiana del Monte Tabor — Hospital San Rafael', null, null, null, null, null, null, null, null, null, null, null],
    ['NIT 900.168.662-2', null, null, null, null, null, null, null, null, null, null, null],
    [null],
    ['Consecutivo:', '', null, null, 'Tasa EURO:', 1, null, null, null, null, null, null],
    ['Fecha de solicitud:', '', null, null, 'Tasa USD:', 1, null, null, null, null, null, null],
    ['Proceso de compra:', '', null, null, 'Tasa COP:', 1, null, null, null, null, null, null],
    [null],
    [null],
    [null],
    [null],
    // Column headers (row 11)
    [
      'Línea de proyecto',
      'Sitio',
      'Descripción',
      'Unidad de manejo',
      'Cantidad Solicitada',
      'Precio Unitario en COP',
      'Precio total en moneda',
      'Compra local',
      'Compra internacional',
      'Contrato marco',
      'Referencia de transporte',
      'Comentarios',
    ],
    // Sample item row
    ['LP-001', 'Quirófano', 'Bolsa de drenaje 100ml x50', 'Caja', 10, 45000, 450000, 'X', '', '', '', ''],
    ['LP-001', 'UCI', 'Guantes estériles talla M x100', 'Caja', 5, 85000, 425000, 'X', '', '', '', ''],
    // End marker
    ['Subtotal', null, null, null, null, null, '=SUM(G12:G13)', null, null, null, null, null],
    ['Gastos de transporte', null, null, null, null, null, 0, null, null, null, null, null],
    ['Total COP', null, null, null, null, null, '=G14+G15', null, null, null, null, null],
    [null],
    ['Solicitante:', '', null, null, 'Gestor de Existencias:', '', null, null, null, null, null, null],
    ['Responsable Financiero:', '', null, null, 'Coordinador de Proyecto:', '', null, null, null, null, null, null],
  ]

  const sheet = XLSX.utils.aoa_to_sheet(metaRows)

  // Style the header row (row index 10 = row 11 in Excel)
  const headerRowIndex = 10
  const columns = 12
  for (let col = 0; col < columns; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
    if (!sheet[cellAddr]) continue
    sheet[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '6D1369' } },
      alignment: { horizontal: 'center', wrapText: true },
    }
  }

  // Set column widths
  sheet['!cols'] = [
    { wch: 18 }, // Línea de proyecto
    { wch: 12 }, // Sitio
    { wch: 45 }, // Descripción
    { wch: 16 }, // Unidad de manejo
    { wch: 18 }, // Cantidad Solicitada
    { wch: 22 }, // Precio Unitario en COP
    { wch: 22 }, // Precio total
    { wch: 14 }, // Compra local
    { wch: 18 }, // Compra internacional
    { wch: 15 }, // Contrato marco
    { wch: 22 }, // Referencia de transporte
    { wch: 20 }, // Comentarios
  ]

  XLSX.utils.book_append_sheet(workbook, sheet, 'Requisición')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Plantilla_RQ_AdminBHSR.xlsx"',
    },
  })
}
