import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * GET /api/rq/import/template
 *
 * Genera y descarga una plantilla Excel en blanco con la estructura
 * correcta para importar RQs al sistema AdminBHSR.
 */
export async function GET() {
  const workbook = XLSX.utils.book_new()

  const metaRows: (string | number | null)[][] = [
    // Row 1: Hospital name
    ['Fundación Italocolombiana del Monte Tabor — Hospital San Rafael', null, null, null, null, null, null, null, null, null, null],
    // Row 2: NIT
    ['NIT 900.168.662-2', null, null, null, null, null, null, null, null, null, null],
    // Row 3: empty
    [null],
    // Row 4: Consecutivo + Tasa EURO
    ['Consecutivo:', '', null, null, 'Tasa EURO (COP):', 4219.38, null, null, null, null, null],
    // Row 5: Fecha solicitud + Tasa USD
    ['Fecha de solicitud:', '', null, null, 'Tasa USD (COP):', 3674.14, null, null, null, null, null],
    // Row 6: Proceso de compra + IVA
    ['Proceso de compra:', '', null, null, 'IVA aplicable (0, 5 o 19):', 0, null, null, null, null, null],
    // Rows 7-10: empty
    [null],
    [null],
    ['INSTRUCCIONES: Complete la información de los ítems a partir de la fila 12. No modifique los encabezados de la fila 11.'],
    [null],
    // Row 11: Column headers
    [
      'Línea de proyecto',
      'Descripción *',
      'Unidad de manejo',
      'Cantidad Solicitada *',
      'Precio Unitario en COP',
      'Precio total en moneda',
      'Compra local',
      'Compra internacional',
      'Contrato marco',
      'Referencia de transporte',
      'Comentarios',
    ],
    // Row 12: Sample item 1
    ['LP-001', 'Bolsa de drenaje 100ml x50', 'Caja', 10, 45000, 450000, 'X', '', '', '', ''],
    // Row 13: Sample item 2
    ['LP-001', 'Guantes estériles talla M x100', 'Caja', 5, 85000, 425000, 'X', '', '', '', ''],
    // Row 14: Subtotal
    ['Subtotal', null, null, null, null, '=SUM(F12:F13)', null, null, null, null, null],
    // Row 15: Gastos transporte
    ['Gastos de transporte', null, null, null, null, 0, null, null, null, null, null],
    // Row 16: Total
    ['Total COP', null, null, null, null, '=F14+F15', null, null, null, null, null],
    [null],
    // Row 18: Firmas
    ['Solicitante:', '', null, null, 'Gestor de Existencias:', '', null, null, null, null, null],
    ['Responsable Financiero:', '', null, null, 'Coordinador de Proyecto:', '', null, null, null, null, null],
  ]

  const sheet = XLSX.utils.aoa_to_sheet(metaRows)

  // Style the column header row (row index 10 = row 11 in Excel)
  const headerRowIndex = 10
  const columns = 11
  for (let col = 0; col < columns; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
    if (!sheet[cellAddr]) continue
    sheet[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '6D1369' } },
      alignment: { horizontal: 'center', wrapText: true },
    }
  }

  // Style instruction row (row 9, index 8)
  const instrCell = XLSX.utils.encode_cell({ r: 8, c: 0 })
  if (sheet[instrCell]) {
    sheet[instrCell].s = {
      font: { italic: true, color: { rgb: '555555' } },
    }
  }

  // Set column widths
  sheet['!cols'] = [
    { wch: 20 }, // Línea de proyecto
    { wch: 48 }, // Descripción
    { wch: 18 }, // Unidad de manejo
    { wch: 20 }, // Cantidad Solicitada
    { wch: 24 }, // Precio Unitario en COP
    { wch: 24 }, // Precio total
    { wch: 14 }, // Compra local
    { wch: 20 }, // Compra internacional
    { wch: 16 }, // Contrato marco
    { wch: 24 }, // Referencia de transporte
    { wch: 22 }, // Comentarios
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
