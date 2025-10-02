import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/blob'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EntityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as EntityType
    const entityId = formData.get('entityId') as string

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const key = `${entityType}/${entityId}/${Date.now()}-${file.name}`
    const blob = await uploadFile(file, key)

    // Save to database
    const fileAsset = await prisma.fileAsset.create({
      data: {
        entityType,
        entityId,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        storageKey: key,
        urlSigned: blob.url,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({
      id: fileAsset.id,
      url: blob.url,
      name: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}