// 클라이언트 사이드 세션 관리 (localStorage 기반)

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STUDENT'
  isApproved: boolean
}

const SESSION_KEY = 'classhub_session'

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(user: SessionUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('sessionChanged'))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('sessionChanged'))
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'ADMIN'
}
