'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, isAdmin } from '@/lib/auth-client'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, Heart, Eye, MessageSquare, Trash2, Edit3, Send, CornerDownRight } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author: string
  authorId: string
  isAnonymous: boolean
  likes: number
  createdAt: string
  replies: Comment[]
}

interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  isAnonymous: boolean
  isPinned: boolean
  board: string
  views: number
  likes: number
  liked?: boolean
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

interface PostDetailProps {
  boardLabel: string
  boardColor: string
  backHref?: string
  initialPost?: Post
}

export default function PostDetail({ boardLabel, boardColor, backHref, initialPost }: PostDetailProps) {
  const params = useParams()
  const router = useRouter()
  const user = getSession()
  const classroom = params.classroom as string
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(initialPost || null)
  const [isLoading, setIsLoading] = useState(!initialPost)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialPost?.likes || 0)
  const [isLiking, setIsLiking] = useState(false)

  const [newComment, setNewComment] = useState('')
  const [isAnonymousComment, setIsAnonymousComment] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const back = backHref || (post ? `/${classroom}/${post.board}` : `/${classroom}`)

  // 좋아요 상태 localStorage에서 복원
  const likeKey = `liked_post_${postId}`

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.post) {
        setPost(data.post)
        setLikeCount(data.post.likes || 0)
        const savedLiked = localStorage.getItem(likeKey) === 'true'
        setLiked(savedLiked)
      } else {
        setError(data.error || '게시글을 찾을 수 없습니다.')
      }
    } catch {
      setError('게시글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [postId, likeKey])

  useEffect(() => {
    if (!initialPost) {
      fetchPost()
    } else {
      const savedLiked = localStorage.getItem(likeKey) === 'true'
      setLiked(savedLiked)
    }
  }, [fetchPost, initialPost, likeKey])

  const handleLike = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return }
    if (isLiking) return
    // 낙관적 업데이트
    const newLiked = !liked
    const newCount = newLiked ? likeCount + 1 : likeCount - 1
    setLiked(newLiked)
    setLikeCount(newCount)
    setIsLiking(true)
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setLiked(data.liked)
        setLikeCount(data.likes)
        localStorage.setItem(likeKey, String(data.liked))
      } else {
        setLiked(!newLiked)
        setLikeCount(likeCount)
      }
    } catch {
      setLiked(!newLiked)
      setLikeCount(likeCount)
    } finally { setIsLiking(false) }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return
    setIsSubmittingComment(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment.trim(), isAnonymous: isAnonymousComment }),
      })
      const data = await res.json()
      if (data.success) {
        setNewComment('')
        setPost((prev) => prev ? { ...prev, comments: [...(prev.comments || []), { ...data.comment, replies: [] }] } : prev)
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.')
      }
    } finally { setIsSubmittingComment(false) }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!user || !replyContent.trim()) return
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: replyContent.trim(), isAnonymous: isAnonymousComment, parentId }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyContent('')
        setReplyTo(null)
        setPost((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === parentId ? { ...c, replies: [...(c.replies || []), data.comment] } : c
            ),
          }
        })
      } else {
        alert(data.error || '답글 작성에 실패했습니다.')
      }
    } catch { /* ignore */ }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPost((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            comments: prev.comments
              .filter((c) => c.id !== commentId)
              .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) })),
          }
        })
      } else {
        const d = await res.json()
        alert(d.error || '삭제에 실패했습니다.')
      }
    } catch { /* ignore */ }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editContent.trim()) return
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setPost((prev) => prev ? { ...prev, title: editTitle.trim(), content: editContent.trim() } : prev)
        setIsEditing(false)
      } else {
        alert(data.error || '수정에 실패했습니다.')
      }
    } catch { /* ignore */ }
  }

  const handleDelete = () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    // 즉시 이동, 삭제는 백그라운드 처리
    router.push(`/${classroom}/${post?.board}`)
    router.refresh()
    fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id }),
    }).catch(() => {})
  }

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  )

  if (error || !post) return (
    <div className="max-w-3xl mx-auto text-center py-16">
      <p className="text-gray-500">{error || '게시글을 찾을 수 없습니다.'}</p>
      <Link href={back} className="mt-4 inline-block text-blue-600 hover:underline">돌아가기</Link>
    </div>
  )

  const canEdit = user?.id === post.authorId
  const canDelete = user?.id === post.authorId || isAdmin(user)
  const totalComments = post.comments?.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0) || 0

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* 뒤로가기 */}
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {boardLabel}으로 돌아가기
      </Link>

      {/* 게시글 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-5 border-b">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold border-0 border-b-2 border-blue-300 focus:outline-none pb-1"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">수정 완료</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{post.title}</h1>
                {(canEdit || canDelete) && (
                  <div className="flex gap-2 shrink-0">
                    {canEdit && (
                      <button onClick={() => { setEditTitle(post.title); setEditContent(post.content); setIsEditing(true) }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border rounded-md hover:bg-gray-50 transition-colors">
                        <Edit3 className="h-3.5 w-3.5" /> 수정
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={handleDelete}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> 삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="font-medium text-gray-600">{post.isAnonymous ? '익명' : post.author}</span>
                <span>{formatDateTime(post.createdAt)}</span>
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {post.views}</span>
                <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {totalComments}</span>
              </div>
            </>
          )}
        </div>

        {/* 본문 */}
        {!isEditing && (
          <div className="px-6 py-6">
            <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">{post.content}</div>
          </div>
        )}

        {/* 좋아요 */}
        {!isEditing && (
          <div className="px-6 py-4 border-t flex justify-center">
            <button onClick={handleLike} disabled={isLiking}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                liked
                  ? 'border-pink-400 bg-pink-50 text-pink-600'
                  : 'border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-500'
              }`}>
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              좋아요 {likeCount}
            </button>
          </div>
        )}
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">댓글 {totalComments}개</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 댓글 작성 */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                rows={3}
                className="w-full px-4 py-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={isAnonymousComment}
                    onChange={(e) => setIsAnonymousComment(e.target.checked)} className="rounded" />
                  익명
                </label>
                <button type="submit" disabled={isSubmittingComment || !newComment.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Send className="h-3.5 w-3.5" />
                  {isSubmittingComment ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-3 text-center text-sm text-gray-500">
              <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>하시면 댓글을 작성할 수 있습니다.
            </div>
          )}

          {/* 댓글 목록 */}
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3 pt-2">
              {post.comments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    postAuthorId={post.authorId}
                    user={user}
                    onDelete={handleDeleteComment}
                    onReply={() => setReplyTo(replyTo?.id === comment.id ? null : { id: comment.id, author: comment.author })}
                  />
                  {/* 답글 작성 폼 */}
                  {replyTo?.id === comment.id && user && (
                    <div className="ml-8 mt-2 space-y-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`${replyTo.author}님에게 답글...`}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setReplyTo(null); setReplyContent('') }}
                          className="px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50">취소</button>
                        <button onClick={() => handleReplySubmit(comment.id)} disabled={!replyContent.trim()}
                          className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                          답글 등록
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 대댓글 */}
                  {comment.replies?.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} postAuthorId={post.authorId}
                          user={user} onDelete={handleDeleteComment} isReply />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 댓글 컴포넌트 ────────────────────────────────

function CommentItem({ comment, postAuthorId, user, onDelete, onReply, isReply }: {
  comment: Comment
  postAuthorId: string
  user: ReturnType<typeof getSession>
  onDelete: (id: string) => void
  onReply?: () => void
  isReply?: boolean
}) {
  const canDelete = user && (user.id === comment.authorId || isAdmin(user))
  const initials = comment.author.charAt(0).toUpperCase()

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-2' : ''}`}>
      {isReply && <CornerDownRight className="h-4 w-4 text-gray-300 mt-2 shrink-0" />}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{comment.author}</span>
          {comment.authorId === postAuthorId && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">글쓴이</span>
          )}
          <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {!isReply && onReply && (
            <button onClick={onReply} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              답글
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
