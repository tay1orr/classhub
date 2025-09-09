'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThumbsUp, MessageCircle, Flag, Send } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'

interface Comment {
  id: string
  content: string
  author: string
  authorId: string
  isAnonymous: boolean
  parentId?: string
  likesCount: number
  createdAt: string
  replies: Comment[]
}

interface CommentSystemProps {
  postId: string
}

interface CommentItemProps {
  comment: Comment
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => Promise<void>
  onReport: (commentId: string) => Promise<void>
  user: any
  depth?: number
}

function CommentItem({ comment, onReply, onLike, onReport, user, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent('')
      setShowReplyForm(false)
    } catch (error) {
      console.error('Reply failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
              {comment.isAnonymous ? '익명' : comment.author.charAt(0)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm">
                  {comment.isAnonymous ? '익명' : comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(comment.id)}
                  className="h-8 px-2 text-gray-600 hover:text-blue-600"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {comment.likesCount}
                </Button>
                
                {user && depth < 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-8 px-2 text-gray-600 hover:text-green-600"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    답글
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReport(comment.id)}
                  className="h-8 px-2 text-gray-600 hover:text-red-600"
                >
                  <Flag className="h-3 w-3 mr-1" />
                  신고
                </Button>
              </div>
              
              {showReplyForm && (
                <div className="mt-3 space-y-2">
                  <textarea
                    placeholder="답글을 작성하세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false)
                        setReplyContent('')
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      답글 작성
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 대댓글들 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onReport={onReport}
              user={user}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSystem({ postId }: CommentSystemProps) {
  const [user, setUser] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/comments?postId=${postId}`)
      const data = await response.json()
      
      if (response.ok) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          authorId: user.id,
          content: newComment,
          isAnonymous: false
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setComments(prev => [...prev, data.comment])
        setNewComment('')
      } else {
        alert('댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Comment creation failed:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (!user) return

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        authorId: user.id,
        content,
        parentId,
        isAnonymous: false
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      // 댓글 목록 새로고침
      await loadComments()
    } else {
      throw new Error('답글 작성에 실패했습니다.')
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      if (response.ok) {
        // 댓글 목록 새로고침
        await loadComments()
      }
    } catch (error) {
      console.error('Like failed:', error)
    }
  }

  const handleReport = async (commentId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (confirm('이 댓글을 신고하시겠습니까?')) {
      try {
        // TODO: 신고 API 구현
        alert('신고가 접수되었습니다.')
      } catch (error) {
        console.error('Report failed:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        댓글 {comments.length}개
      </h3>
      
      {/* 새 댓글 작성 */}
      {user ? (
        <div className="mb-6 space-y-3">
          <textarea
            placeholder="댓글을 작성하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              댓글 작성
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">댓글을 작성하려면 로그인이 필요합니다.</p>
        </div>
      )}
      
      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onReport={handleReport}
              user={user}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">아직 댓글이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}