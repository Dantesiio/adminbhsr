import { redirect } from 'next/navigation'

/**
 * Root page — the middleware handles unauthenticated redirects to /login.
 * Authenticated users land here and are forwarded to the dashboard.
 */
export default function Home() {
  redirect('/dashboard')
}
