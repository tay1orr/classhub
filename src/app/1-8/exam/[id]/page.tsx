'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, Heart, Trash2, ThumbsDown } from 'lucide-react'
import { getCurrentUser, canDeletePost, canDeleteComment } from '@/lib/simple-auth'
import { useParams } from 'next/navigation'

// 기본 게시글 없음 - 사용자가 작성한 글만 표시
const defaultPosts: any[] = []

export default function ExamPostDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentLikes, setCommentLikes] = useState<{[key: string]: {liked: boolean, disliked: boolean}}>({})
  const [commentCounts, setCommentCounts] = useState<{[key: string]: {likes: number, dislikes: number}}>({});
  const params = useParams()
  const postId = params?.id

  useEffect(() => {
    setUser(getCurrentUser())
    
    // localStorage에서 게시글 찾기
    const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
    const foundPost = storedPosts.find((p: any) => p.id.toString() === postId?.toString() && p.board === 'exam')
    
    if (foundPost) {
      // 조회수 증가
      foundPost.views = (foundPost.views || 0) + 1
      
      // localStorage 업데이트
      const updatedPosts = storedPosts.map((p: any) => 
        p.id.toString() === postId?.toString() ? foundPost : p
      )
      localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
      
      setPost(foundPost)
      setViewCount(foundPost.views)
      setLikeCount(foundPost.likes || 0)
    } else {
      // 기본 게시글에서 찾기
      const defaultPost = defaultPosts.find(p => p.id.toString() === postId?.toString())
      if (defaultPost) {
        setPost(defaultPost)
        setViewCount(defaultPost.views || 0)
        setLikeCount(defaultPost.likes || 0)
      }
    }

    // 댓글 로드
    const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
    const postComments = storedComments.filter((comment: any) => comment.postId === postId?.toString())
    setComments(postComments)

    // 댓글 좋아요/싫어요 상태 초기화
    const initialLikes: {[key: string]: {liked: boolean, disliked: boolean}} = {}
    const initialCounts: {[key: string]: {likes: number, dislikes: number}} = {}
    postComments.forEach((comment: any) => {
      initialLikes[comment.id] = { liked: false, disliked: false }
      initialCounts[comment.id] = { likes: comment.likes || 0, dislikes: comment.dislikes || 0 }
    })
    setCommentLikes(initialLikes)
    setCommentCounts(initialCounts)

    // 시간 업데이트를 위한 interval 설정
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(timeInterval)
  }, [postId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = currentTime
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    // 1주일 이상이면 날짜만 표시
    if (days >= 7) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).replace(/\. /g, '. ')
    }
    
    // 1주일 미만이면 상대적 시간 표시
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
  }

  const handleDeletePost = async () => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return

    try {
      // localStorage에서 게시글 삭제
      const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
      const updatedPosts = storedPosts.filter((p: any) => p.id.toString() !== postId?.toString())
      localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))

      // 해당 게시글의 댓글도 모두 삭제
      const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
      const updatedComments = storedComments.filter((c: any) => c.postId !== postId?.toString())
      localStorage.setItem('classhub_comments', JSON.stringify(updatedComments))

      alert('게시글이 삭제되었습니다.')
      window.location.href = '/1-8/exam'
    } catch (error) {
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    try {
      // localStorage에서 댓글 삭제
      const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
      const updatedComments = storedComments.filter((c: any) => c.id !== commentId)
      localStorage.setItem('classhub_comments', JSON.stringify(updatedComments))

      // 댓글 목록 업데이트
      setComments(prev => prev.filter(c => c.id !== commentId))

      // 게시글 댓글 수 업데이트
      if (post) {
        const updatedPost = { ...post, comments: Math.max(0, (post.comments || 1) - 1) }
        setPost(updatedPost)

        // localStorage에서 게시글 댓글 수도 업데이트
        const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
        const updatedPosts = storedPosts.map((p: any) =>
          p.id.toString() === postId?.toString() ? updatedPost : p
        )
        localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
      }

      alert('댓글이 삭제되었습니다.')
    } catch (error) {
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmittingComment(true)

    try {
      const comment = {
        id: Date.now(),
        postId: postId?.toString(),
        content: newComment.trim(),
        author: user.name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0
      }

      // localStorage에서 기존 댓글 가져오기
      const storedComments = JSON.parse(localStorage.getItem('classhub_comments') || '[]')
      storedComments.push(comment)
      localStorage.setItem('classhub_comments', JSON.stringify(storedComments))

      // 댓글 목록 업데이트
      setComments(prev => [...prev, comment])
      setNewComment('')
      
      // 새 댓글 좋아요/싫어요 상태 초기화
      setCommentLikes(prev => ({
        ...prev,
        [comment.id]: { liked: false, disliked: false }
      }))
      setCommentCounts(prev => ({
        ...prev,
        [comment.id]: { likes: 0, dislikes: 0 }
      }))

      // 게시글 댓글 수 업데이트
      if (post) {
        const updatedPost = { ...post, comments: (post.comments || 0) + 1 }
        setPost(updatedPost)

        // localStorage에서 게시글 댓글 수도 업데이트
        const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
        const updatedPosts = storedPosts.map((p: any) =>
          p.id.toString() === postId?.toString() ? updatedPost : p
        )
        localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))
      }

    } catch (error) {
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentLike = (commentId: number, isLike: boolean) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    const currentState = commentLikes[commentId] || { liked: false, disliked: false }
    const newState = { ...currentState }

    if (isLike) {
      // 좋아요 클릭
      if (newState.liked) {
        // 이미 좋아요한 경우 -> 좋아요 취소
        newState.liked = false
        setCommentCounts(prev => ({
          ...prev,
          [commentId]: { ...prev[commentId], likes: Math.max(0, prev[commentId].likes - 1) }
        }))
      } else {
        // 좋아요하지 않은 경우 -> 좋아요
        newState.liked = true
        setCommentCounts(prev => ({
          ...prev,
          [commentId]: { ...prev[commentId], likes: prev[commentId].likes + 1 }
        }))
        // 싫어요가 되어있다면 싫어요도 취소
        if (newState.disliked) {
          newState.disliked = false
          setCommentCounts(prev => ({
            ...prev,
            [commentId]: { ...prev[commentId], dislikes: Math.max(0, prev[commentId].dislikes - 1) }
          }))
        }
      }
    } else {
      // 싫어요 클릭
      if (newState.disliked) {
        // 이미 싫어요한 경우 -> 싫어요 취소
        newState.disliked = false
        setCommentCounts(prev => ({
          ...prev,
          [commentId]: { ...prev[commentId], dislikes: Math.max(0, prev[commentId].dislikes - 1) }
        }))
      } else {
        // 싫어요하지 않은 경우 -> 싫어요
        newState.disliked = true
        setCommentCounts(prev => ({
          ...prev,
          [commentId]: { ...prev[commentId], dislikes: prev[commentId].dislikes + 1 }
        }))
        // 좋아요가 되어있다면 좋아요도 취소
        if (newState.liked) {
          newState.liked = false
          setCommentCounts(prev => ({
            ...prev,
            [commentId]: { ...prev[commentId], likes: Math.max(0, prev[commentId].likes - 1) }
          }))
        }
      }
    }

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: newState
    }))
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
          <Link href="/1-8/free">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">지필평가로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <div className="flex items-center gap-4">
        <Link href="/1-8/exam" className="flex items-center gap-2 text-purple-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          지필평가로 돌아가기
        </Link>
      </div>

      {/* 게시글 */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* 제목과 태그 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {post.isPinned && (
                  <Badge className="bg-yellow-500 text-white">공지</Badge>
                )}
                {post.tags && post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-2xl font-bold">{post.title}</h1>
            </div>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-b pb-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {(post.isAnonymous || post.anonymous) ? '익명' : post.author}
                </span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likeCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 게시글 내용 */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* 좋아요/댓글 버튼 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="flex items-center gap-3">
              <Button
                variant={liked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className={liked ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                좋아요 {likeCount}
              </Button>
              
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                댓글 {post.comments || 0}
              </Button>
            </div>

            {/* 게시글 삭제 버튼 (관리자 또는 작성자만) */}
            {user && canDeletePost(post, user) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePost}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>댓글 {post.comments || 0}개</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              {/* 댓글 목록 */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      {/* 댓글 삭제 버튼 (관리자만) */}
                      {user && canDeleteComment(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50 h-6 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-800 text-sm mb-3">{comment.content}</p>
                    
                    {/* 댓글 좋아요/싫어요 버튼 */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id, true)}
                        className={`h-6 px-2 ${commentLikes[comment.id]?.liked ? 'text-blue-600 bg-blue-50' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50`}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {commentCounts[comment.id]?.likes || 0}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id, false)}
                        className={`h-6 px-2 ${commentLikes[comment.id]?.disliked ? 'text-red-600 bg-red-50' : 'text-gray-500'} hover:text-red-600 hover:bg-red-50`}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        {commentCounts[comment.id]?.dislikes || 0}
                      </Button>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                  </div>
                )}
              </div>

              {/* 댓글 작성 폼 */}
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      placeholder="댓글을 입력하세요..."
                      className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link href="/login">
                <Button>로그인하기</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}