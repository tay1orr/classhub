'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, Send, MessageCircle, ThumbsUp, ThumbsDown, Edit3, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/simple-auth'
import { LikeButton } from '@/components/LikeButton'

export default function AssignmentPostDetailPage() {
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentLikes, setCommentLikes] = useState<{[key: string]: {liked: boolean, disliked: boolean}}>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const postId = params?.id

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    if (!postId) return
    
    let isCancelled = false
    
    const loadPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          headers: {
            'Cache-Control': 'max-age=30'
          }
        })
        
        if (isCancelled) return
        
        const data = await response.json()
        
        if (response.ok && data.post) {
          // localStorage 작업을 비동기로 처리하여 성능 개선
          setTimeout(() => {
            if (isCancelled) return
            
            const localComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]')
            const allComments = [...(data.post.comments || []), ...localComments]
            const uniqueComments = allComments.filter((comment, index, self) => 
              index === self.findIndex(c => c.id === comment.id)
            )
            
            // localStorage에서 replies 정보도 복원
            const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${postId}`) || '{}')
            uniqueComments.forEach(comment => {
              // 로컬 댓글의 replies 복원
              const localComment = localComments.find((lc: any) => lc.id === comment.id)
              if (localComment && localComment.replies) {
                comment.replies = localComment.replies
              }
              // API 댓글의 replies도 복원
              else if (apiCommentReplies[comment.id]) {
                comment.replies = apiCommentReplies[comment.id]
              }
            })
            
            uniqueComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            
            setPost({
              ...data.post,
              comments: uniqueComments
            })
          }, 0)
          
          // 기본 게시글은 먼저 표시
          setPost(data.post)
        } else {
          setError(data.error || '게시글을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('Error:', error)
        setError('오류가 발생했습니다.')
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }
    
    loadPost()
    
    // 클린업 함수로 메모리 누수 방지
    return () => {
      isCancelled = true
    }
  }, [postId])

  const handleEditStart = () => {
    setEditTitle(post.title)
    setEditContent(post.content)
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          userId: user.id
        })
      })

      const result = await response.json()
      if (response.ok) {
        setPost({
          ...post,
          title: editTitle.trim(),
          content: editContent.trim()
        })
        setIsEditing(false)
        alert('게시글이 수정되었습니다.')
      } else {
        throw new Error(result.error || '게시글 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Edit error:', error)
      alert('게시글 수정 중 오류가 발생했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      const result = await response.json()
      if (response.ok) {
        alert('게시글이 삭제되었습니다.')
        router.push('/1-8/assignment')
      } else {
        throw new Error(result.error || '게시글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  const canEdit = user && post && user.id === post.authorId
  const canDelete = user && post && (user.id === post.authorId || isAdmin(user))

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

      // localStorage에 댓글 저장
      const localComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]')
      localComments.push(comment)
      localStorage.setItem(`comments_${postId}`, JSON.stringify(localComments))
      
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

      // localStorage에 모든 댓글의 replies 정보 저장
      const currentLocal = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]')
      
      // 로컬 전용 댓글 업데이트
      const mergedLocal = currentLocal.map((local: any) => {
        const updated = updatedComments.find((c: any) => c.id === local.id)
        return updated ? updated : local
      })
      
      // 새로운 로컬 전용 댓글 추가
      const apiCommentIds = (post.comments || []).map((c: any) => c.id)
      const newLocalComments = updatedComments.filter((c: any) => !apiCommentIds.includes(c.id) && !currentLocal.some((local: any) => local.id === c.id))
      
      // API 댓글의 replies도 별도로 저장
      const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${postId}`) || '{}')
      updatedComments.forEach((comment: any) => {
        if (apiCommentIds.includes(comment.id) && comment.replies && comment.replies.length > 0) {
          apiCommentReplies[comment.id] = comment.replies
        }
      })
      
      localStorage.setItem(`comments_${postId}`, JSON.stringify([...mergedLocal, ...newLocalComments]))
      localStorage.setItem(`replies_${postId}`, JSON.stringify(apiCommentReplies))
      
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

    // localStorage에도 업데이트 (replies 포함)
    const currentLocal = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]')
    const mergedLocal = currentLocal.map((local: any) => {
      const updated = updatedComments.find((c: any) => c.id === local.id)
      return updated ? updated : local
    })
    
    // 새로운 로컬 전용 댓글 추가
    const apiCommentIds = (post.comments || []).map((c: any) => c.id)
    const newLocalComments = updatedComments.filter((c: any) => !apiCommentIds.includes(c.id) && !currentLocal.some((local: any) => local.id === c.id))
    
    // API 댓글의 replies도 별도로 저장
    const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${postId}`) || '{}')
    updatedComments.forEach((comment: any) => {
      if (apiCommentIds.includes(comment.id) && comment.replies && comment.replies.length > 0) {
        apiCommentReplies[comment.id] = comment.replies
      }
    })
    
    localStorage.setItem(`comments_${postId}`, JSON.stringify([...mergedLocal, ...newLocalComments]))
    localStorage.setItem(`replies_${postId}`, JSON.stringify(apiCommentReplies))
    
    setPost((prev: any) => ({ ...prev, comments: updatedComments }))
  }

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>
  }

  if (error || !post) {
    return (
      <div className="p-8">
        <p className="text-red-500">{error}</p>
        <Link href="/1-8/assignment">
          <Button>돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/1-8/assignment" className="flex items-center gap-2 text-green-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        수행평가로 돌아가기
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            {isEditing ? (
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-green-500 focus:outline-none bg-transparent"
                  placeholder="제목을 입력하세요"
                />
              </div>
            ) : (
              <CardTitle className="flex-1">{post.title}</CardTitle>
            )}
            
            {/* 편집/삭제 버튼 */}
            {(canEdit || canDelete) && !isEditing && (
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditStart}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    수정
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="text-sm text-gray-600">
                작성자: {post.author} | 작성일: {new Date(post.createdAt).toLocaleString()}
              </div>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="내용을 입력하세요"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? '수정 중...' : '수정 완료'}
                </Button>
                <Button type="button" variant="outline" onClick={handleEditCancel}>
                  취소
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                작성자: {post.author} | 작성일: {new Date(post.createdAt).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          )}
            
          {/* 게시글 좋아요 - 편집 중이 아닐 때만 표시 */}
          {!isEditing && (
            <div className="mt-6 pt-4 border-t">
              <LikeButton
                postId={post.id}
                initialLikes={post.likes || 0}
                initialDislikes={post.dislikes || 0}
                size="default"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Card>
        <CardContent className="pt-6">
            
          <div className="mt-8">
              <h3 className="font-semibold mb-4">댓글 {post.comments ? post.comments.reduce((total: number, comment: any) => total + 1 + (comment.replies ? comment.replies.length : 0), 0) : 0}개</h3>
              
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
                    <Link href="/login" className="text-green-600 hover:underline font-medium">
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.author || '익명'}</span>
                                {comment.authorId === post.authorId && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    글쓴이
                                  </span>
                                )}
                              </div>
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
                            className={`flex items-center gap-1 text-xs hover:text-green-600 transition-colors ${
                              commentLikes[comment.id]?.liked ? 'text-green-600' : 'text-gray-500'
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
                            <div key={reply.id || replyIndex} className="bg-white p-3 rounded-lg border-l-4 border-gray-300 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-semibold text-xs">
                                    {reply.author ? reply.author.charAt(0) : 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs">{reply.author || '익명'}</span>
                                    {reply.authorId === post.authorId && (
                                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full" style={{fontSize: '10px'}}>
                                        글쓴이
                                      </span>
                                    )}
                                  </div>
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
                                  className={`flex items-center gap-1 text-xs hover:text-green-600 transition-colors ${
                                    commentLikes[reply.id]?.liked ? 'text-green-600' : 'text-gray-500'
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
        </CardContent>
      </Card>
    </div>
  )
}