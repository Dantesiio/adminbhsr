import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isAuthenticated = !!session
  const pathname = nextUrl.pathname

  // Permitir rutas de autenticación
  const isAuthRoute = pathname.startsWith('/api/auth')
  if (isAuthRoute) {
    return
  }

  const isLoginPage = pathname === '/login'
  const isPublicRoute = isLoginPage

  // Redirigir al login si no está autenticado y no está en ruta pública
  if (!isAuthenticated && !isPublicRoute) {
    const from = pathname + (nextUrl.search || '')
    const redirectUrl = new URL('/login', nextUrl)
    // Solo guardar el "from" si no es la página principal
    if (from && from !== '/') {
      redirectUrl.searchParams.set('from', from)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Si está autenticado y trata de acceder al login, redirigir al dashboard
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}