'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function FixPostsPage() {
  const [status, setStatus] = useState('')
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    // 페이지 로드시 자동으로 게시글 수정
    fixMemoryPosts()
  }, [])

  const fixMemoryPosts = () => {
    try {
      const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
      let modified = false

      const updatedPosts = storedPosts.map((post: any) => {
        // "우리반 처음 만난 날" 또는 추억 관련 키워드가 있는 게시글을 찾아서 memories로 이동
        if (post.title && (
          post.title.includes('우리반 처음 만난 날') ||
          post.title.includes('추억') ||
          post.title.includes('기억') ||
          post.title.includes('생일') ||
          post.title.includes('사진') ||
          post.title.includes('함께')
        ) && post.board === 'exam') {
          modified = true
          return {
            ...post,
            board: 'memories',
            hasImage: post.imageData ? true : false
          }
        }
        return post
      })

      if (modified) {
        localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
        setStatus('✅ 게시글이 성공적으로 이동되었습니다!')
        setPosts(updatedPosts)
        
        // 메인 페이지로 자동 이동 (3초 후)
        setTimeout(() => {
          window.location.href = '/1-8'
        }, 3000)
      } else {
        setStatus('ℹ️ 이동할 게시글이 없습니다.')
        setPosts(storedPosts)
      }

    } catch (error) {
      setStatus('❌ 오류가 발생했습니다: ' + (error as Error).message)
    }
  }

  const examPosts = posts.filter(p => p.board === 'exam')
  const memoryPosts = posts.filter(p => p.board === 'memories')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          메인으로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>게시글 게시판 자동 수정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">상태</h3>
            <p className="text-blue-700">{status}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">지필평가 게시글 ({examPosts.length}개)</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                {examPosts.slice(0, 5).map((post, index) => (
                  <li key={index}>• {post.title}</li>
                ))}
                {examPosts.length > 5 && <li>... 외 {examPosts.length - 5}개</li>}
              </ul>
            </div>

            <div className="p-4 bg-pink-50 rounded-lg">
              <h3 className="font-semibold text-pink-800 mb-2">추억 게시글 ({memoryPosts.length}개)</h3>
              <ul className="text-sm text-pink-700 space-y-1">
                {memoryPosts.slice(0, 5).map((post, index) => (
                  <li key={index}>• {post.title}</li>
                ))}
                {memoryPosts.length > 5 && <li>... 외 {memoryPosts.length - 5}개</li>}
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={fixMemoryPosts} className="mr-3">
              다시 수정하기
            </Button>
            <Link href="/1-8">
              <Button variant="outline">
                메인 페이지로 가기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}