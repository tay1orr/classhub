'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, Send, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/simple-auth'

export default function PostDetailPage() {
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentLikes, setCommentLikes] = useState<{[key: string]: {liked: boolean, disliked: boolean}}>({})
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
      const comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        author: user.name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        replies: []
      }

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

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !user) {
      alert('로그인이 필요하거나 답글 내용을 입력해주세요.')
      return
    }

    try {
      const reply = {
        id: Date.now().toString(),
        content: replyContent.trim(),
        author: user.name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        parentId: parentId
      }

      const updatedComments = (post.comments || []).map((comment: any) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          }
        }
        return comment
      })

      const updatedPost = {
        ...post,
        comments: updatedComments
      }
      
      setPost(updatedPost)
      setReplyContent('')
      setReplyTo(null)
      alert('답글이 작성되었습니다!')
    } catch (error) {
      console.error('Reply error:', error)
      alert('답글 작성 중 오류가 발생했습니다.')
    }
  }

  const handleCommentLike = (commentId: string, isLike: boolean, isReply: boolean = false, parentId?: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    const currentState = commentLikes[commentId] || { liked: false, disliked: false }
    const newState = { ...currentState }

    if (isLike) {
      newState.liked = !newState.liked
      if (newState.liked && newState.disliked) {
        newState.disliked = false
      }
    } else {
      newState.disliked = !newState.disliked
      if (newState.disliked && newState.liked) {
        newState.liked = false
      }
    }

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: newState
    }))

    // 실제 좋아요/싫어요 수 업데이트 (localStorage 기반)
    const updatedComments = (post.comments || []).map((comment: any) => {
      if (isReply && comment.id === parentId) {
        const updatedReplies = comment.replies.map((reply: any) => {
          if (reply.id === commentId) {
            return {
              ...reply,
              likes: Math.max(0, (reply.likes || 0) + (newState.liked ? 1 : currentState.liked ? -1 : 0)),
              dislikes: Math.max(0, (reply.dislikes || 0) + (newState.disliked ? 1 : currentState.disliked ? -1 : 0))
            }
          }
          return reply
        })
        return { ...comment, replies: updatedReplies }
      } else if (!isReply && comment.id === commentId) {
        return {
          ...comment,
          likes: Math.max(0, (comment.likes || 0) + (newState.liked ? 1 : currentState.liked ? -1 : 0)),
          dislikes: Math.max(0, (comment.dislikes || 0) + (newState.disliked ? 1 : currentState.disliked ? -1 : 0))
        }
      }
      return comment
    })

    setPost(prev => ({ ...prev, comments: updatedComments }))
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
                <div className="space-y-4">
                  {post.comments.map((comment: any, index: number) => (
                    <div key={comment.id || index}>
                      {/* 메인 댓글 */}
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-200">
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
                        <div className="ml-11 text-sm text-gray-700 leading-relaxed mb-3">
                          {comment.content}
                        </div>
                        
                        {/* 댓글 액션 버튼들 */}
                        <div className="ml-11 flex items-center gap-4">
                          <button
                            onClick={() => handleCommentLike(comment.id, true)}
                            className={`flex items-center gap-1 text-xs hover:text-blue-600 transition-colors ${
                              commentLikes[comment.id]?.liked ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likes || 0}
                          </button>
                          
                          <button
                            onClick={() => handleCommentLike(comment.id, false)}
                            className={`flex items-center gap-1 text-xs hover:text-red-600 transition-colors ${
                              commentLikes[comment.id]?.disliked ? 'text-red-600' : 'text-gray-500'
                            }`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                            {comment.dislikes || 0}
                          </button>
                          
                          {user && (
                            <button
                              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              답글
                            </button>
                          )}
                        </div>
                        
                        {/* 답글 작성 폼 */}
                        {replyTo === comment.id && user && (
                          <div className="ml-11 mt-4 space-y-3">
                            <Textarea
                              placeholder={`${comment.author}님에게 답글을 작성하세요...`}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[60px] text-sm resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyTo(null)
                                  setReplyContent('')
                                }}
                              >
                                취소
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={!replyContent.trim()}
                              >
                                답글 작성
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 대댓글들 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 mt-3 space-y-3">
                          {comment.replies.map((reply: any, replyIndex: number) => (
                            <div key={reply.id || replyIndex} className="bg-white p-3 rounded-lg border-l-4 border-green-200 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 font-semibold text-xs">
                                    {reply.author ? reply.author.charAt(0) : 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-xs">{reply.author || '익명'}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(reply.createdAt).toLocaleString('ko-KR')}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-9 text-xs text-gray-700 leading-relaxed mb-2">
                                {reply.content}
                              </div>
                              
                              {/* 대댓글 좋아요 버튼들 */}
                              <div className="ml-9 flex items-center gap-3">
                                <button
                                  onClick={() => handleCommentLike(reply.id, true, true, comment.id)}
                                  className={`flex items-center gap-1 text-xs hover:text-blue-600 transition-colors ${
                                    commentLikes[reply.id]?.liked ? 'text-blue-600' : 'text-gray-500'
                                  }`}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  {reply.likes || 0}
                                </button>
                                
                                <button
                                  onClick={() => handleCommentLike(reply.id, false, true, comment.id)}
                                  className={`flex items-center gap-1 text-xs hover:text-red-600 transition-colors ${
                                    commentLikes[reply.id]?.disliked ? 'text-red-600' : 'text-gray-500'
                                  }`}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                  {reply.dislikes || 0}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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