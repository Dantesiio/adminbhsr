import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

const trustHostEnv = process.env.AUTH_TRUST_HOST
const trustHost =
  trustHostEnv === 'true' ||
  trustHostEnv === '1' ||
  Boolean(process.env.VERCEL) ||
  process.env.NODE_ENV !== 'production'

/**
 * Use this instead of auth() in Server Actions.
 * next-auth v5-beta calls headers().then() internally (Next.js 15 async API),
 * which breaks in Next.js 14 where headers() is synchronous.
 * getToken reads the JWT cookie directly without that async path.
 */
export async function getServerActionSession() {
  const cookieStore = cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
  const req = new Request('http://localhost/', { headers: { cookie: cookieHeader } })
  // In production (Vercel HTTPS) next-auth uses __Secure-authjs.session-token as cookie
  // name AND as the HKDF salt for JWT encryption. Must match or decryption fails.
  const secureCookie = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production'
  const token = await getToken({ req, secret: secret ?? '', secureCookie })
  if (!token?.sub) return null
  return { user: { id: token.sub, role: (token.role as string) ?? '' } }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  trustHost,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user?.passwordHash) {
            console.error('[Auth] User not found or no password:', email)
            return null
          }

          const isPasswordValid = await compare(password, user.passwordHash)

          if (!isPasswordValid) {
            console.error('[Auth] Invalid password for user:', email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] Database error:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as Role
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
})