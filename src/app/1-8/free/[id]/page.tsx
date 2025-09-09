'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function PostDetailPage() {
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const postId = params?.id

  useEffect(() => {
    if (!postId) return
    
    const loadPost = async () => {
      try {
        console.log('Loading post:', postId)
        const response = await fetch(`/api/posts/${postId}`)
        const data = await response.json()
        
        console.log('API response:', data)
        
        if (response.ok && data.post) {
          setPost(data.post)
        } else {
          setError(data.error || '게시글을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('Error:', error)
        setError('오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPost()
  }, [postId])

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>
  }

  if (error || !post) {
    return (
      <div className="p-8">
        <p className="text-red-500">{error}</p>
        <Link href="/1-8/free">
          <Button>돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/1-8/free" className="flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        자유게시판으로 돌아가기
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              작성자: {post.author} | 작성일: {new Date(post.createdAt).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">
              {post.content}
            </div>
            
            {post.comments && post.comments.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-4">댓글 {post.comments.length}개</h3>
                <div className="space-y-3">
                  {post.comments.map((comment: any, index: number) => (
                    <div key={comment.id || index} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600 mb-1">
                        {comment.author} | {new Date(comment.createdAt).toLocaleString()}
                      </div>
                      <div>{comment.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}