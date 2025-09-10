'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Search, Plus, Eye, MessageSquare, ThumbsUp, Trash2, CheckSquare, Square } from 'lucide-react'
import { getCurrentUser, isAdmin } from '@/lib/simple-auth'
import { LikeButton } from '@/components/LikeButton'

export default function FreeBoardPage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
    loadPosts()
  }, [])

  // 클라이언트 사이드에서 localStorage 댓글 수 업데이트
  useEffect(() => {
    if (posts.length > 0) {
      const timer = setTimeout(() => {
        const updatedPosts = posts.map((post: any) => {
          try {
            const localComments = JSON.parse(localStorage.getItem(`comments_${post.id}`) || '[]')
            const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${post.id}`) || '{}')
            
            let localCommentCount = localComments.length
            
            localComments.forEach((comment: any) => {
              if (comment.replies && comment.replies.length > 0) {
                localCommentCount += comment.replies.length
              }
            })
            
            Object.values(apiCommentReplies).forEach((replies: any) => {
              if (Array.isArray(replies)) {
                localCommentCount += replies.length
              }
            })
            
            if (localCommentCount > 0 && post.comments === (post.originalComments || post.comments)) {
              return {
                ...post,
                originalComments: post.originalComments || post.comments,
                comments: (post.originalComments || post.comments) + localCommentCount
              }
            }
            return post
          } catch (error) {
            return post
          }
        })
        
        if (JSON.stringify(updatedPosts) !== JSON.stringify(posts)) {
          setPosts(updatedPosts)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [posts.length])

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      
      if (response.ok) {
        // 자유게시판 게시글만 필터링
        const freePosts = data.posts.filter((post: any) => post.board === 'free')
        
        // 클라이언트 사이드에서만 localStorage 처리
        let postsWithLocalComments = freePosts
        if (typeof window !== 'undefined') {
          postsWithLocalComments = freePosts.map((post: any) => {
            try {
              const localComments = JSON.parse(localStorage.getItem(`comments_${post.id}`) || '[]')
              const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${post.id}`) || '{}')
              
              // 로컬 댓글 수
              let localCommentCount = localComments.length
              
              // 로컬 댓글의 답글 수
              localComments.forEach((comment: any) => {
                if (comment.replies && comment.replies.length > 0) {
                  localCommentCount += comment.replies.length
                }
              })
              
              // API 댓글의 답글 수
              Object.values(apiCommentReplies).forEach((replies: any) => {
                if (Array.isArray(replies)) {
                  localCommentCount += replies.length
                }
              })
              
              return {
                ...post,
                comments: post.comments + localCommentCount
              }
            } catch (error) {
              return post
            }
          })
        }
        
        // 공지사항을 먼저, 그 다음 최신순으로 정렬
        postsWithLocalComments.sort((a: any, b: any) => {
          // 공지사항 우선
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          
          // 같은 공지 여부면 최신순
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        
        setPosts(postsWithLocalComments)
      }
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

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

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id.toString()))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return
    
    if (!confirm(`선택한 ${selectedPosts.length}개의 게시글을 삭제하시겠습니까?`)) return

    try {
      // API를 통해 게시글 삭제
      const deletePromises = selectedPosts.map(postId => 
        fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      // 상태 업데이트
      setPosts(prev => prev.filter(p => !selectedPosts.includes(p.id.toString())))
      setSelectedPosts([])
      setIsSelectMode(false)
      
      alert(`${selectedPosts.length}개의 게시글이 삭제되었습니다.`)
    } catch (error) {
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">💬 우리반 자유게시판</h1>
          <p className="text-muted-foreground mt-2">
            자유롭게 이야기하고 소통해요
          </p>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          {/* 글쓰기 버튼 */}
          {user ? (
            <Link href="/1-8/free/write">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                글쓰기
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                로그인 후 글쓰기
              </Button>
            </Link>
          )}
          
          {/* 관리자 전용 게시글 관리 버튼 */}
          {user && isAdmin(user) && (
            <div className="flex gap-2">
              {!isSelectMode ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSelectMode(true)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  게시글 관리
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    {selectedPosts.length === filteredPosts.length ? '전체 해제' : '전체 선택'}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedPosts.length === 0}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    선택 삭제 ({selectedPosts.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedPosts([])
                    }}
                  >
                    취소
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/1-8" className="text-blue-600 hover:underline">
          ← 1-8 홈으로
        </Link>
        <div className="text-sm text-gray-500">
          총 {filteredPosts.length}개의 게시글
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="게시글 검색..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">최신순</option>
              <option value="views">조회순</option>
              <option value="likes">추천순</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id} className={`${post.isPinned ? 'border-yellow-200 bg-yellow-50/30' : ''} ${selectedPosts.includes(post.id.toString()) ? 'border-blue-300 bg-blue-50/30' : ''}`}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* 제목과 뱃지 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* 선택 모드일 때 체크박스 */}
                      {isSelectMode && user && isAdmin(user) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelectPost(post.id.toString())
                          }}
                          className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded hover:border-blue-500"
                        >
                          {selectedPosts.includes(post.id.toString()) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {post.isPinned && (
                            <Badge className="bg-yellow-500 text-white">공지</Badge>
                          )}
                          {post.tags && post.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Link href={`/1-8/free/${post.id}`} onClick={(e) => isSelectMode && e.preventDefault()}>
                          <h3 className={`text-lg font-semibold cursor-pointer flex items-center gap-2 ${!isSelectMode ? 'hover:text-blue-600' : 'text-gray-700'}`}>
                            {post.title}
                            <span className="flex items-center gap-1 text-blue-500 text-sm">
                              <MessageSquare className="h-3 w-3" />
                              {post.comments || 0}
                            </span>
                          </h3>
                        </Link>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        {(post.isAnonymous || post.anonymous) ? '익명' : post.author}
                      </span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views || 0}</span>
                      </div>
                      <LikeButton
                        postId={post.id}
                        initialLikes={post.likes || 0}
                        initialDislikes={post.dislikes || 0}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500 mb-4">아직 게시글이 없습니다.</p>
              {user && (
                <Link href="/1-8/free/write">
                  <Button>첫 게시글 작성하기</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 로그인 안내 - 로그인하지 않은 사용자만 표시 */}
      {!user && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                로그인
              </Link>하시면 글쓰기, 댓글, 추천 기능을 이용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}