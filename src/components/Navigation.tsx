'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getSession, clearSession, isAdmin } from '@/lib/auth-client'
import { CLASS_CONFIG } from '@/lib/config'
import { Menu, X, Shield, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: `/${CLASS_CONFIG.slug}`, label: '🏠 홈' },
  { href: `/${CLASS_CONFIG.slug}/free`, label: '💬 자유게시판' },
  { href: `/${CLASS_CONFIG.slug}/evaluation`, label: '📝 수행/지필평가' },
  { href: `/${CLASS_CONFIG.slug}/suggestion`, label: '💡 건의사항' },
  { href: `/${CLASS_CONFIG.slug}/memories`, label: '📸 우리반 추억' },
]

export default function Navigation() {
  const [user, setUser] = useState(getSession())
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('sessionChanged', sync)
    return () => window.removeEventListener('sessionChanged', sync)
  }, [])

  const handleLogout = () => {
    clearSession()
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href={`/${CLASS_CONFIG.slug}`} className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0">
            {CLASS_CONFIG.displayName}
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== `/${CLASS_CONFIG.slug}` && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* 우측 유저 영역 */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 font-medium">{user.name}님 👋</span>
                {isAdmin(user) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <Shield className="h-3 w-3" />
                    관리자
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  로그인
                </Link>
                <Link href="/signup" className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t pt-3 mt-3">
            {user ? (
              <div className="space-y-1">
                <p className="px-3 text-sm text-gray-500">{user.name}님 환영합니다</p>
                {isAdmin(user) && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-red-600 font-medium">
                    🛡 관리자 패널
                  </Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-red-600">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                  로그인
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
