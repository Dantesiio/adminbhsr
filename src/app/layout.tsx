import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import logoBHSR from '@/lib/images/logo.svg.jpeg'

export const metadata: Metadata = {
  title: 'AdminBHSR',
  description: 'AdminBHSR · Plataforma integral de requisiciones del Hospital San Rafael.',
  icons: {
    icon: [
  { url: logoBHSR.src, rel: 'icon', type: 'image/jpeg' },
      { url: logoBHSR.src, sizes: '192x192', type: 'image/jpeg' },
    ],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
  <body className="min-h-screen bg-[#fefbfe] text-brand-plum">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}