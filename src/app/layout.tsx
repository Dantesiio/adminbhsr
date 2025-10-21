import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import logoHorizontal from '@/lib/images/logo.png'

export const metadata: Metadata = {
  title: 'AdminBHSR',
  description: 'AdminBHSR · Plataforma integral de requisiciones del Hospital San Rafael.',
  icons: {
    icon: [
      { url: logoHorizontal.src, rel: 'icon', type: 'image/png' },
      { url: logoHorizontal.src, sizes: '192x192', type: 'image/png' },
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