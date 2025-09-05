'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Heart, MessageSquare, Share2, MoreHorizontal, Send } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'
import { useParams } from 'next/navigation'

export default function MemoryDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentLikes, setCommentLikes] = useState<{[key: string]: boolean}>({})
  const params = useParams()
  const postId = params?.id

  useEffect(() => {
    setUser(getCurrentUser())
    
    const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
    const foundPost = storedPosts.find((p: any) => p.id.toString() === postId?.toString() && p.board === 'memories')
    
    if (foundPost) {
      setPost(foundPost)
      setLikeCount(foundPost.likes || 0)
      
      // 조회수 증가
      const updatedPosts = storedPosts.map((p: any) => 
        p.id === foundPost.id ? { ...p, views: (p.views || 0) + 1 } : p
      )
      localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
    }

    // 댓글 로드
    const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
    const postComments = storedComments.filter((c: any) => 
      c.postId.toString() === postId?.toString() && c.board === 'memories'
    ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    setComments(postComments)
  }, [postId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days >= 7) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).replace(/\\. /g, '. ')
    }
    
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  const handleLike = () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)

    // localStorage 업데이트
    const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
    const updatedPosts = storedPosts.map((p: any) => 
      p.id === post.id ? { ...p, likes: liked ? (p.likes || 0) - 1 : (p.likes || 0) + 1 } : p
    )
    localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
  }

  const handleCommentLike = (commentId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    const isCurrentlyLiked = commentLikes[commentId] || false
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !isCurrentlyLiked
    }))

    // 댓글 좋아요 수 업데이트
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: isCurrentlyLiked ? (comment.likes || 0) - 1 : (comment.likes || 0) + 1 }
        : comment
    ))
  }

  const handleCommentSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) return

    setIsSubmittingComment(true)

    try {
      const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
      const newCommentId = Math.max(...storedComments.map((c: any) => c.id), 0) + 1

      const comment = {
        id: newCommentId,
        postId: parseInt(postId as string),
        board: 'memories',
        content: newComment.trim(),
        author: user.name,
        createdAt: new Date().toISOString(),
        likes: 0
      }

      const updatedComments = [...storedComments, comment]
      localStorage.setItem('classhub_comments', JSON.stringify(updatedComments))

      setComments(prev => [...prev, comment])
      setNewComment('')

      // 게시글 댓글 수 업데이트
      const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
      const updatedPosts = storedPosts.map((p: any) => 
        p.id === post.id ? { ...p, comments: (p.comments || 0) + 1 } : p
      )
      localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
      setPost((prev: any) => ({ ...prev, comments: (prev.comments || 0) + 1 }))

    } catch (error) {
      console.error('Error adding comment:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">추억을 찾을 수 없습니다.</p>
          <Link href="/1-8/memories">
            <Button className="mt-4 bg-pink-500 hover:bg-pink-600">추억 게시판으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8/memories" className="flex items-center gap-2 text-pink-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          추억 게시판으로 돌아가기
        </Link>
      </div>

      {/* 인스타그램 스타일 포스트 카드 */}
      <Card className="border border-gray-200 dark:border-gray-800">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(post.isAnonymous || post.anonymous) ? '익' : post.author.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm">
                {(post.isAnonymous || post.anonymous) ? '익명' : post.author}
              </div>
              <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* 이미지 */}
        {post.imageData && (
          <div className="w-full">
            <img 
              src={post.imageData} 
              alt={post.title}
              className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
            />
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-0 h-auto ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            >
              <Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-600 hover:text-blue-500">
              <MessageSquare className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-600 hover:text-green-500">
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* 좋아요 수 */}
        <div className="px-4 pb-2">
          <div className="text-sm font-semibold">좋아요 {likeCount}개</div>
        </div>

        {/* 제목과 내용 */}
        <div className="px-4 pb-2">
          <div className="text-sm">
            <span className="font-semibold mr-2">
              {(post.isAnonymous || post.anonymous) ? '익명' : post.author}
            </span>
            <span className="font-medium text-lg">{post.title}</span>
          </div>
          <div className="text-sm mt-1 whitespace-pre-wrap">{post.content}</div>
        </div>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-blue-600 text-sm hover:underline cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {comment.author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold mr-2">{comment.author}</span>
                      <span className="break-words">{comment.content}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className={`text-xs ${commentLikes[comment.id] ? 'text-red-500 font-semibold' : 'text-gray-500 hover:text-red-500'}`}
                      >
                        좋아요 {comment.likes || 0}개
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 입력 */}
          {user ? (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 border-none bg-transparent focus-visible:ring-0 px-0"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleCommentSubmit()
                  }
                }}
              />
              <Button
                onClick={handleCommentSubmit}
                disabled={isSubmittingComment || !newComment.trim()}
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-blue-500 hover:text-blue-600 disabled:text-gray-400"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link href="/login">
                <Button size="sm" className="bg-pink-500 hover:bg-pink-600">로그인하기</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}