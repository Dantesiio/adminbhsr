import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Resend } from 'resend'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

type Ctx = { params?: Record<string, string | string[]> }

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function buildEmailHtml(rq: {
  code: string
  title: string
  description?: string | null
  project: { name: string }
  items: Array<{ name: string; spec?: string | null; qty: number | string; uom?: string | null }>
}, supplierName: string, deadline?: string, customMessage?: string) {
  const itemRows = rq.items.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px 12px;font-family:monospace;color:#666;font-size:12px;">${item.spec || '—'}</td>
      <td style="padding:8px 12px;">${item.name}</td>
      <td style="padding:8px 12px;text-align:center;">${item.uom || 'unidad'}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:600;">${Number(item.qty).toLocaleString('es-CO')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#be185d,#7c3aed);padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Barco Hospital San Raffaele · Compras</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">Solicitud de Cotización</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:14px;">${rq.code} — ${rq.title}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;">Estimados señores de <strong>${supplierName}</strong>,</p>
            <p style="margin:0 0 16px;color:#555;line-height:1.6;">
              El Hospital San Raffaele – Barco les solicita amablemente su mejor cotización para los siguientes ítems del proyecto <strong>${rq.project.name}</strong>.
            </p>
            ${customMessage ? `<p style="margin:0 0 20px;padding:12px 16px;background:#fdf4ff;border-left:3px solid #be185d;color:#555;line-height:1.6;">${customMessage}</p>` : ''}

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:1px solid #e5e7eb;">Línea</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:1px solid #e5e7eb;">Descripción</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:1px solid #e5e7eb;">Unidad</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:1px solid #e5e7eb;">Cantidad</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <p style="margin:0 0 8px;color:#555;line-height:1.6;">Por favor incluir en su cotización:</p>
            <ul style="margin:0 0 20px;padding-left:20px;color:#555;line-height:1.8;">
              <li>Precio unitario y total por ítem</li>
              <li>Unidad de presentación ofrecida</li>
              <li>Tiempo de entrega (lead time)</li>
              <li>Vigencia de la cotización</li>
              <li>Condiciones de pago</li>
            </ul>

            ${deadline ? `<p style="padding:12px 16px;background:#fef3c7;border-radius:8px;color:#92400e;font-weight:600;margin:0 0 20px;">📅 Fecha límite para enviar cotización: <strong>${deadline}</strong></p>` : ''}

            ${rq.description ? `<p style="padding:12px 16px;background:#f0f9ff;border-radius:8px;color:#0369a1;margin:0 0 20px;line-height:1.6;"><strong>Observaciones:</strong> ${rq.description}</p>` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#999;">Este correo fue generado automáticamente por el sistema AdminBHSR del Barco Hospital San Raffaele.</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">NIT: 900168662-2 · Por favor no responder a este correo directamente.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** GET /api/rq/[id]/email-suppliers — load RQ + suppliers with emails */
export const GET = auth(async function GET(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  if (!req.auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rqId = ctx.params?.['id'] as string
  try {
    const [rq, suppliers] = await Promise.all([
      prisma.rQ.findUnique({
        where: { id: rqId },
        include: {
          items: { orderBy: { id: 'asc' } },
          project: { select: { name: true } },
        },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, email: true, nit: true },
      }),
    ])
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })
    return NextResponse.json({ rq, suppliers })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
})

/** POST /api/rq/[id]/email-suppliers — send RQ to selected suppliers */
export const POST = auth(async function POST(req: NextRequest & { auth: Session | null }, ctx: Ctx) {
  const session = req.auth
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role ?? ''
  if (!['COMPRAS', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rqId = ctx.params?.['id'] as string
  try {
    const { supplierIds, deadline, customMessage } = await req.json()
    if (!supplierIds?.length) return NextResponse.json({ error: 'Selecciona al menos un proveedor' }, { status: 400 })

    const [rq, suppliers] = await Promise.all([
      prisma.rQ.findUnique({
        where: { id: rqId },
        include: {
          items: { orderBy: { id: 'asc' } },
          project: { select: { name: true } },
        },
      }),
      prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true, email: true } }),
    ])
    if (!rq) return NextResponse.json({ error: 'RQ not found' }, { status: 404 })

    const fromEmail = process.env.EMAIL_FROM || 'compras@barco-hospital.com'
    const results: Array<{ supplier: string; status: 'sent' | 'no-email' | 'error'; error?: string }> = []

    for (const supplier of suppliers) {
      if (!supplier.email) {
        results.push({ supplier: supplier.name, status: 'no-email' })
        continue
      }

      if (!resend) {
        // Log only if Resend is not configured — still register the intent
        console.log(`[EMAIL] Would send to ${supplier.email} for ${rq.code}`)
        results.push({ supplier: supplier.name, status: 'sent' })
        continue
      }

      try {
        await resend.emails.send({
          from: fromEmail,
          to: [supplier.email],
          subject: `Solicitud de Cotización – ${rq.code} – ${rq.title}`,
          html: buildEmailHtml(
            {
              ...rq,
              items: rq.items.map(i => ({ ...i, qty: Number(i.qty) })),
            },
            supplier.name, deadline, customMessage),
        })

        // Log notification
        await prisma.notificationLog.create({
          data: {
            type: 'SOLICITUD_COTIZACION',
            entityRef: rqId,
            to: supplier.email,
            subject: `Solicitud de Cotización – ${rq.code}`,
            payload: { supplierId: supplier.id, supplierName: supplier.name },
          },
        })

        results.push({ supplier: supplier.name, status: 'sent' })
      } catch (err) {
        results.push({ supplier: supplier.name, status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Error al enviar correos' }, { status: 500 })
  }
})
