'use client'

import { useEffect } from 'react'
import { getCurrentUser } from '@/lib/simple-auth'

export default function HomePage() {
  useEffect(() => {
    // 로그인한 사용자는 1-8 홈으로 자동 리디렉션
    const user = getCurrentUser()
    if (user) {
      window.location.href = '/1-8'
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-blue-600">
          우리반에 오신 것을 환영합니다! 🎉
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          1학년 8반만의 특별한 소통 공간
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <a 
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            로그인
          </a>
          <a 
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50"
          >
            회원가입
          </a>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6 border-blue-200 bg-blue-50/30">
          <h3 className="text-xl font-semibold text-blue-700">💬 자유게시판</h3>
          <p className="mt-2 text-muted-foreground">
            우리반 친구들과 자유롭게 소통해요
          </p>
        </div>
        
        <div className="rounded-lg border p-6 border-green-200 bg-green-50/30">
          <h3 className="text-xl font-semibold text-green-700">📝 수행평가</h3>
          <p className="mt-2 text-muted-foreground">
            과제 정보와 자료를 함께 공유해요
          </p>
        </div>
        
        <div className="rounded-lg border p-6 border-purple-200 bg-purple-50/30">
          <h3 className="text-xl font-semibold text-purple-700">📚 지필평가</h3>
          <p className="mt-2 text-muted-foreground">
            시험 정보와 스터디 자료를 나눠요
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-600">
          <strong>직접 접속:</strong>
        </p>
        <div className="mt-2 space-x-4">
          <a href="/login" className="text-blue-600 underline">로그인 페이지</a>
          <a href="/signup" className="text-blue-600 underline">회원가입 페이지</a>
          <a href="/1-8" className="text-blue-600 underline">1-8 학급</a>
        </div>
      </div>
    </div>
  )
}