'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, Heart } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'
import { useParams } from 'next/navigation'

// 기본 게시글 없음 - 사용자가 작성한 글만 표시
const defaultPosts: any[] = []

export default function ExamPostDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const params = useParams()
  const postId = params?.id

  useEffect(() => {
    setUser(getCurrentUser())
    
    const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
    const foundPost = storedPosts.find((p: any) => p.id.toString() === postId?.toString() && p.board === 'exam')
    
    if (foundPost) {
      setPost(foundPost)
      setLikeCount(foundPost.likes || 0)
    } else {
      const defaultPost = defaultPosts.find(p => p.id.toString() === postId?.toString())
      if (defaultPost) {
        setPost(defaultPost)
        setLikeCount(defaultPost.likes || 0)
      }
    }
  }, [postId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
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

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
          <Link href="/1-8/exam">
            <Button className="mt-4">지필평가로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8/exam" className="flex items-center gap-2 text-purple-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          지필평가로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500 text-white">지필평가</Badge>
                {post.tags && post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-purple-700">{post.title}</h1>
            </div>

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
                  <span>{post.views || 0}</span>
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
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>댓글 {post.comments || 0}개</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                댓글 기능은 준비 중입니다 😊
              </div>
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