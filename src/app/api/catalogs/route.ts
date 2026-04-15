import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/catalogs
 *
 * Returns simple lists of projects and cost centres.  These are
 * consumed by the new RQ form to populate select dropdowns.  When
 * expanding the data model in the future, this endpoint could be
 * extended to include units of measure or other lookup tables.
 */
export async function GET() {
  try {
    const [projects, costCenters] = await Promise.all([
      prisma.project.findMany({ select: { id: true, name: true } }),
      prisma.costCenter.findMany({ select: { id: true, name: true } }),
    ])
    return NextResponse.json({ projects, costCenters })
  } catch (error) {
    console.error('Database error:', error)
    // Return mock data if database is not available
    return NextResponse.json({ 
      projects: [
        { id: '1', name: 'ECHO Bolsas 06/2025' },
        { id: '2', name: 'ECHO 731' },
        { id: '3', name: 'Mensajería Agosto 2025' },
      ],
      costCenters: [
        { id: '1', name: 'Operaciones' },
        { id: '2', name: 'Logística' },
        { id: '3', name: 'Administración' },
      ]
    })
  }
}