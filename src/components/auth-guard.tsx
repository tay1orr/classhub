'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // 로그인이 필요없는 페이지들
  const publicPaths = ['/', '/login', '/signup']

  useEffect(() => {
    const currentUserStr = localStorage.getItem('classhub_current_user')
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    setUser(currentUser)
    setIsLoading(false)

    // localStorage 변경 감지
    const handleStorageChange = () => {
      const updatedUserStr = localStorage.getItem('classhub_current_user')
      const updatedUser = updatedUserStr ? JSON.parse(updatedUserStr) : null
      setUser(updatedUser)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userStatusChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userStatusChanged', handleStorageChange)
    }
  }, [])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 공개 페이지이거나 로그인된 경우 정상 표시
  if (publicPaths.includes(pathname) || user) {
    return <>{children}</>
  }

  // 로그인하지 않은 사용자에게 보여줄 화면
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                우리반
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button>회원가입</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🔒 로그인이 필요합니다
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              우리반 커뮤니티를 이용하려면 로그인해주세요
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-blue-600">1학년 8반 전용 커뮤니티</CardTitle>
              <CardDescription>
                우리반 친구들과 함께 소통하고 공부해요!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-blue-700 mb-2">💬 자유게시판</h3>
                  <p className="text-sm text-gray-600">친구들과 자유롭게 대화</p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <h3 className="font-semibold text-green-700 mb-2">📝 수행평가</h3>
                  <p className="text-sm text-gray-600">과제 정보와 자료 공유</p>
                </div>
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h3 className="font-semibold text-purple-700 mb-2">📚 지필평가</h3>
                  <p className="text-sm text-gray-600">시험 정보와 스터디</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="px-8">
                  로그인하기
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="px-8">
                  회원가입
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-gray-500">
              계정이 없으신가요? 회원가입 후 바로 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}