'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/simple-auth'
import Link from 'next/link'

export default function WritePostPage() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 말머리 목록
  const categories = [
    { value: '', label: '선택 안함' },
    { value: '공지', label: '📢 공지' },
    { value: '질문', label: '❓ 질문' },
    { value: '정보', label: '💡 정보' },
    { value: '잡담', label: '💬 잡담' },
    { value: '유머', label: '😄 유머' },
    { value: '생활', label: '🏠 생활' },
    { value: '학습', label: '📚 학습' },
    { value: '진로', label: '🎯 진로' }
  ]

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      window.location.href = '/login'
      return
    }
    setUser(currentUser)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 데이터베이스에 게시글 저장
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          authorId: user.id,
          boardKey: 'FREE',
          isAnonymous: anonymous,
          isPinned,
          category: category || null
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '게시글 등록에 실패했습니다.')
      }
      
      alert('게시글이 등록되었습니다!')
      // 강제 새로고침으로 최신 데이터 로드 + 캐시 무시
      window.location.replace(`/1-8/free?refresh=${Date.now()}`)
      window.location.reload()
    } catch (error) {
      alert('게시글 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div>로그인 확인 중...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8/free" className="text-blue-600 hover:underline">
          ← 자유게시판으로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 게시글 작성</CardTitle>
          <CardDescription>
            자유게시판에 새로운 게시글을 작성해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                말머리
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                제목
              </label>
              <Input
                id="title"
                type="text"
                placeholder="게시글 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                내용
              </label>
              <Textarea
                id="content"
                placeholder="게시글 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                <label htmlFor="anonymous" className="text-sm">
                  익명으로 작성하기
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-yellow-600">
                  📌 공지사항으로 등록 (상단 고정)
                </label>
              </div>
              
              {isPinned && (
                <div className="text-xs text-yellow-600 ml-5">
                  공지사항은 게시판 맨 위에 고정되며, 메인페이지 "우리반 소식"에도 표시됩니다.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '등록 중...' : '게시글 등록'}
              </Button>
              <Link href="/1-8/free">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}