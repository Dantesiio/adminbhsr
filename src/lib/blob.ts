import { put, del, head } from '@vercel/blob'
import { auth } from './auth'

export async function uploadFile(file: File, key: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const blob = await put(key, file, {
    access: 'public',
  })

  return blob
}

export async function deleteFile(url: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await del(url)
}

export async function generateSignedUrl(key: string) {
  // For Vercel Blob, files are public, but we can implement signed URLs if needed
  // For now, return the public URL
  const baseUrl = process.env.BLOB_READ_WRITE_TOKEN
    ? `https://${process.env.VERCEL_URL || 'localhost:3000'}`
    : 'https://vercel-blob.com'

  return `${baseUrl}/${key}`
}

export async function getFileMetadata(key: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const blob = await head(key)
  return blob
}