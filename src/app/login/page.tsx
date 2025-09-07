'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 데이터베이스 기반 로그인 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        alert(`${result.user.name}님, 로그인되었습니다!`)
        
        // 사용자 정보를 localStorage에 저장 (세션 관리용)
        localStorage.setItem('classhub_current_user', JSON.stringify(result.user))
        
        // 네비바 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event('userStatusChanged'))
        
        // 학급 홈으로 리디렉션
        window.location.href = '/1-8'
      } else {
        alert(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">우리반 로그인</CardTitle>
          <CardDescription>
            1학년 8반 전용 공간에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@classhub.co.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">계정이 없으신가요?</p>
            <Link href="/signup" className="text-primary hover:underline">
              회원가입
            </Link>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>계정이 없으신가요?</strong>
            </p>
            <p className="text-xs text-blue-600">회원가입 후 로그인해주세요</p>
            <p className="text-xs text-gray-500 mt-2">
              관리자 권한이 필요한 경우 담당 선생님께 문의하세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}