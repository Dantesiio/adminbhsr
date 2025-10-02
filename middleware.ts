import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isAuthenticated = !!session
  const pathname = nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/api/auth')
  if (isAuthRoute) {
    return
  }

  const isLoginPage = pathname === '/login'

  if (!isAuthenticated && !isLoginPage) {
    const from = pathname + (nextUrl.search || '')
    const redirectUrl = new URL('/login', nextUrl)
    if (from && from !== '/') {
      redirectUrl.searchParams.set('from', from)
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}