'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CLASS_CONFIG } from '@/lib/config'
import { UserPlus } from 'lucide-react'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (data.success) { setSuccess(data.message) } else { setError(data.error || '회원가입에 실패했습니다.') }
    } catch { setError('서버 오류가 발생했습니다.') }
    finally { setIsLoading(false) }
  }

  if (success) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">회원가입 완료!</h2>
        <p className="text-sm text-gray-600 mb-6">{success}</p>
        <Link href="/login" className="inline-block px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">로그인 페이지로</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">✏️</div>
            <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
            <p className="text-sm text-gray-500 mt-1">{CLASS_CONFIG.displayName} 전용 공간</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
              { key: 'email', label: '이메일', type: 'email', placeholder: 'example@school.kr' },
              { key: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상' },
              { key: 'confirm', label: '비밀번호 확인', type: 'password', placeholder: '비밀번호를 다시 입력' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} required
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            ))}
            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <UserPlus className="h-4 w-4" />
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
