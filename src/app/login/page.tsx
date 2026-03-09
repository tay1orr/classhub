'use client'

import { useState } from 'react'
import Link from 'next/link'
import { setSession } from '@/lib/auth-client'
import { CLASS_CONFIG } from '@/lib/config'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success && data.user) {
        setSession(data.user) // 클라이언트 컴포넌트용 localStorage
        window.location.href = `/${CLASS_CONFIG.slug}`
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏫</div>
            <h1 className="text-2xl font-bold text-gray-900">우리반 로그인</h1>
            <p className="text-sm text-gray-500 mt-1">{CLASS_CONFIG.displayName} 전용 공간</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <LogIn className="h-4 w-4" />
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
              회원가입
            </Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-600 text-center">
            회원가입 후 관리자 승인이 완료되면 로그인할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
