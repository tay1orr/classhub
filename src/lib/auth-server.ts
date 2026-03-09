import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'classhub-fallback-secret-key-2026'
)
const COOKIE_NAME = 'classhub_token'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  isApproved: boolean
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return (payload as any).user as SessionUser
  } catch {
    return null
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionCookie(user)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'ADMIN'
}
