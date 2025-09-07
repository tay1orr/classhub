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
              <strong>테스트 계정:</strong>
            </p>
            <p className="text-xs">admin@classhub.co.kr / admin123! (관리자)</p>
            <p className="text-xs text-blue-600">또는 방금 가입한 이메일과 비밀번호 사용</p>
            <p className="text-xs text-gray-500 mt-2">
              F12 → Console에서 디버그 정보 확인 가능
            </p>
            <button
              type="button"
              onClick={() => {
                // localStorage 완전 초기화
                localStorage.clear();
                
                // 기본 관리자 계정 추가
                const defaultUsers = [{
                  id: '1',
                  name: '관리자', 
                  email: 'admin@classhub.co.kr',
                  password: 'admin123!',
                  role: 'ADMIN'
                }];
                localStorage.setItem('classhub_users', JSON.stringify(defaultUsers));
                
                alert('✅ 인증 데이터가 초기화되었습니다!\n이제 admin@classhub.co.kr / admin123! 로 로그인하세요.');
                window.location.reload();
              }}
              className="mt-3 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded border border-blue-300 transition-colors"
            >
              🔧 로그인 데이터 초기화
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}