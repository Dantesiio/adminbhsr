import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

/**
 * POST /api/rq/import/parse
 *
 * Receives a multipart form-data with a single "file" field (.xlsx / .xls).
 * Returns parsed metadata + items without writing to the database,
 * so the UI can show a preview before the user confirms.
 *
 * Excel structure expected (based on RQ 704, 731, 861 examples):
 *   - Rows 1-11: metadata (Consecutivo, Fecha de solicitud, tasas, Proceso de compra)
 *   - Row ~11:   column headers (Línea de proyecto, Descripción, Unidad de manejo,
 *                Cantidad Solicitada, Precio Unitario en COP, …)
 *   - Rows 12+:  item data rows
 *   - End marker: row whose first non-empty cell contains "Subtotal" or "TOTAL"
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json({ error: 'El archivo debe ser .xlsx o .xls' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer', cellText: true, cellDates: true })

    // Use the first sheet
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Get all rows as arrays (raw values)
    const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: false, // text mode — easier to match metadata keys
    }) as (string | number | null)[][]

    // ── Extract metadata ──────────────────────────────────────────────────────

    let consecutivo = ''
    let fechaSolicitud = ''
    let procesCompra = ''
    let headerRowIndex = -1

    const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase()

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i]
      const joined = row.map((c) => normalize(c)).join('|')

      if (joined.includes('consecutivo')) {
        // Value is in the same row, next non-null cell
        for (let j = 1; j < row.length; j++) {
          if (row[j] !== null && String(row[j]).trim() !== '') {
            consecutivo = String(row[j]).trim()
            break
          }
        }
      }

      if (joined.includes('fecha de solicitud') || joined.includes('fecha solicitud')) {
        for (let j = 1; j < row.length; j++) {
          if (row[j] !== null && String(row[j]).trim() !== '') {
            fechaSolicitud = String(row[j]).trim()
            break
          }
        }
      }

      if (joined.includes('proceso de compra') || joined.includes('proceso compra')) {
        for (let j = 1; j < row.length; j++) {
          if (row[j] !== null && String(row[j]).trim() !== '') {
            procesCompra = String(row[j]).trim()
            break
          }
        }
      }

      // Detect header row: contains "descripción" and "cantidad"
      if (
        (joined.includes('descripci') || joined.includes('descripcion')) &&
        (joined.includes('cantidad'))
      ) {
        headerRowIndex = i
      }
    }

    if (headerRowIndex < 0) {
      return NextResponse.json(
        { error: 'No se encontró la fila de encabezados (Descripción / Cantidad Solicitada). Verifica el formato del archivo.' },
        { status: 422 }
      )
    }

    // ── Map column indexes from header row ────────────────────────────────────

    const headerRow = rows[headerRowIndex].map((c) => normalize(c))

    const findCol = (headerRow: string[], keywords: string[]): number => {
      for (const kw of keywords) {
        const i = headerRow.findIndex((h) => h.includes(kw))
        if (i >= 0) return i
      }
      return -1
    }

    const colLinea     = findCol(headerRow, ['línea de proyecto', 'linea de proyecto', 'línea proyecto', 'linea proyecto', 'línea'])
    const colDesc      = findCol(headerRow, ['descripción', 'descripcion'])
    const colUnidad    = findCol(headerRow, ['unidad de manejo', 'unidad'])
    const colCantidad  = findCol(headerRow, ['cantidad solicitada', 'cantidad'])
    const colPrecio    = findCol(headerRow, ['precio unitario en cop', 'precio unitario', 'precio unit'])

    if (colDesc < 0 || colCantidad < 0) {
      return NextResponse.json(
        { error: 'No se encontraron las columnas requeridas: Descripción y Cantidad Solicitada.' },
        { status: 422 }
      )
    }

    // ── Parse item rows ───────────────────────────────────────────────────────

    const END_MARKERS = ['subtotal', 'total', 'gastos de transporte', 'solicitante', 'firma']

    const items: {
      lineaProyecto: string
      descripcion: string
      unidad: string
      cantidad: number
      precioUnitario: number
    }[] = []

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      // Check for end marker in any cell
      const rowText = row.map((c) => normalize(c)).join(' ')
      if (END_MARKERS.some((marker) => rowText.includes(marker))) break

      const desc = colDesc >= 0 ? String(row[colDesc] ?? '').trim() : ''
      if (!desc) continue // skip empty rows

      const cantidad = colCantidad >= 0 ? parseFloat(String(row[colCantidad] ?? '0').replace(/[^\d.,-]/g, '').replace(',', '.')) || 0 : 0
      const precio   = colPrecio  >= 0 ? parseFloat(String(row[colPrecio]   ?? '0').replace(/[^\d.,-]/g, '').replace(',', '.')) || 0 : 0
      const linea    = colLinea   >= 0 ? String(row[colLinea] ?? '').trim() : ''
      const unidad   = colUnidad  >= 0 ? String(row[colUnidad] ?? '').trim() : 'unidad'

      items.push({
        lineaProyecto: linea,
        descripcion: desc,
        unidad: unidad || 'unidad',
        cantidad,
        precioUnitario: precio,
      })
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron ítems en el archivo. Verifica que la estructura coincida con la plantilla.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      consecutivo,
      fechaSolicitud,
      procesCompra,
      items,
    })
  } catch (err) {
    console.error('Excel parse error:', err)
    return NextResponse.json(
      { error: 'Error al procesar el archivo Excel. Asegúrate de que no esté corrupto.' },
      { status: 500 }
    )
  }
}
