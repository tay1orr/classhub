'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/simple-auth'

export default function PostDetailPage() {
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const params = useParams()
  const postId = params?.id

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) {
      alert('로그인이 필요하거나 댓글 내용을 입력해주세요.')
      return
    }

    setIsSubmittingComment(true)
    try {
      // 간단한 localStorage 기반 댓글 시스템
      const comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        author: user.name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
      }

      // 게시글에 댓글 추가
      const updatedPost = {
        ...post,
        comments: [...(post.comments || []), comment]
      }
      
      setPost(updatedPost)
      setNewComment('')
      alert('댓글이 작성되었습니다!')
    } catch (error) {
      console.error('Comment error:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

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
            
            <div className="mt-8">
              <h3 className="font-semibold mb-4">댓글 {post.comments ? post.comments.length : 0}개</h3>
              
              {/* 댓글 작성 */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                  <Textarea
                    placeholder="댓글을 작성하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
                  <p className="text-gray-600">
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                      로그인
                    </Link>하시면 댓글을 작성할 수 있습니다.
                  </p>
                </div>
              )}
              
              {/* 댓글 목록 */}
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-3">
                  {post.comments.map((comment: any, index: number) => (
                    <div key={comment.id || index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {comment.author ? comment.author.charAt(0) : 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{comment.author || '익명'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-11 text-sm text-gray-700 leading-relaxed">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 댓글이 없습니다.</p>
                  <p className="text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}