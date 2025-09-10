'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser, isAdmin } from '@/lib/simple-auth'
import { MessageSquare, Shield, Heart } from 'lucide-react'
import VictoryBanner from '@/components/ui/victory-banner'

// 우리반 소식 - 사용자가 작성한 공지사항만 표시 (동적으로 로드됨)

const recentPosts = {
  free: [] as any[],
  assignment: [] as any[],
  exam: [] as any[]
}

export default function ClassroomPage() {
  const [user, setUser] = useState<any>(null)
  const [dynamicPosts, setDynamicPosts] = useState<any>({
    free: [],
    assignment: [],
    exam: []
  })
  const [hotPosts, setHotPosts] = useState<any[]>([])
  const [boardNotices, setBoardNotices] = useState<any[]>([])
  const [memoryPosts, setMemoryPosts] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setUser(getCurrentUser())
    
    // API에서 실제 게시글 가져오기
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        const storedPosts = data.posts || [];
        
        updatePostsData(storedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // 실패시 localStorage 폴백
        const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]');
        updatePostsData(storedPosts);
      }
    };
    
    const updatePostsData = (storedPosts: any[]) => {
      // localStorage 댓글 수를 반영한 게시글 업데이트
      const postsWithLocalComments = storedPosts.map((post: any) => {
        try {
          const localComments = JSON.parse(localStorage.getItem(`comments_${post.id}`) || '[]')
          const apiCommentReplies = JSON.parse(localStorage.getItem(`replies_${post.id}`) || '{}')
          
          // 로컬 댓글 수 (답글 중복 카운팅 방지)
          let localCommentCount = localComments.length
          
          // 로컬 댓글의 답글 수만 카운팅 (apiCommentReplies와 중복 방지)
          localComments.forEach((comment: any) => {
            if (comment.replies && comment.replies.length > 0) {
              localCommentCount += comment.replies.length
            }
          })
          
          // API 댓글의 답글은 이미 위에서 카운팅되므로 제거
          // Object.values(apiCommentReplies).forEach((replies: any) => {
          //   if (Array.isArray(replies)) {
          //     localCommentCount += replies.length
          //   }
          // })
          
          if (localCommentCount > 0) {
            console.log(`Post ${post.title}: API comments=${post.comments}, localStorage comments=${localCommentCount}`)
            if (post.comments === (post.originalComments || post.comments)) {
              return {
                ...post,
                originalComments: post.originalComments || post.comments,
                comments: (post.originalComments || post.comments) + localCommentCount
              }
            }
          }
          return post
        } catch (error) {
          return post
        }
      })

      // 공지사항 필터링 (isPinned가 true인 모든 게시글)
      const pinned = postsWithLocalComments
        .filter((post: any) => post.isPinned === true)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5) // 최신 5개
        .map((post: any) => ({
          ...post,
          boardColor: post.board === 'free' ? 'bg-blue-500' : 
                     post.board === 'assignment' ? 'bg-green-500' : 'bg-purple-500',
          boardName: post.board === 'free' ? '자유게시판' :
                     post.board === 'assignment' ? '수행평가' : '지필평가',
          link: `/1-8/${post.board}/${post.id}`
        }))
      
      setBoardNotices(pinned)
      
      const freePosts = postsWithLocalComments.filter((post: any) => post.board === 'free')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      const assignmentPosts = postsWithLocalComments.filter((post: any) => post.board === 'assignment')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      const examPosts = postsWithLocalComments.filter((post: any) => post.board === 'exam')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      const memoryPostsData = postsWithLocalComments.filter((post: any) => post.board === 'memories')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
      
      const allFreePosts = [...recentPosts.free, ...freePosts]
        .sort((a: any, b: any) => new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime())
        .slice(0, 5)
      const allAssignmentPosts = [...recentPosts.assignment, ...assignmentPosts]
        .sort((a: any, b: any) => new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime())
        .slice(0, 5)
      const allExamPosts = [...recentPosts.exam, ...examPosts]
        .sort((a: any, b: any) => new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime())
        .slice(0, 5)
      
      setDynamicPosts({
        free: allFreePosts,
        assignment: allAssignmentPosts,
        exam: allExamPosts
      })

      setMemoryPosts(memoryPostsData)

      // HOT 게시물 생성 (조회수 기준 상위 3개)
      const allPosts = [...postsWithLocalComments]
      // 기본 게시물도 추가 (조회수가 있을 경우)
      const defaultPostsWithBoard = [
        ...recentPosts.free.map((p: any) => ({ ...p, board: 'free', boardColor: 'bg-blue-500' })),
        ...recentPosts.assignment.map((p: any) => ({ ...p, board: 'assignment', boardColor: 'bg-green-500' })),
        ...recentPosts.exam.map((p: any) => ({ ...p, board: 'exam', boardColor: 'bg-purple-500' }))
      ]
      
      const hotPostsList = [...allPosts, ...defaultPostsWithBoard]
        .filter(post => (post.views || 0) > 0) // 조회수가 0보다 큰 게시물만
        .sort((a, b) => (b.views || 0) - (a.views || 0)) // 조회수 내림차순
        .slice(0, 3) // 상위 3개
        .map(post => ({
          ...post,
          boardColor: post.board === 'free' ? 'bg-blue-500' : 
                     post.board === 'assignment' ? 'bg-green-500' : 'bg-purple-500',
          boardName: post.board === 'free' ? '자유게시판' :
                     post.board === 'assignment' ? '수행평가' : '지필평가'
        }))
      
      setHotPosts(hotPostsList)
    }
    
    fetchPosts()

    // 시간 업데이트를 위한 interval 설정
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(timeInterval)
  }, [])

  const formatTime = (dateString: string) => {
    if (!dateString.includes('T')) return dateString
    
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

  return (
    <div className="space-y-6">
      {/* 체육대회 우승 배너 */}
      <VictoryBanner />
      
      {/* 배경 이미지와 제목 섹션 */}
      <div className="relative h-80 md:h-96 rounded-lg overflow-hidden mb-8">
        <Image
          src="/images/class_photo.jpg"
          alt="1학년 8반 우리반 사진"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg leading-tight">
              <span className="block">우리반만의</span>
              <span className="block text-yellow-300">특별한 공간</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-lg mb-6">
              1학년 8반 전용 커뮤니티
            </p>
            {!user && (
              <div className="mt-4 md:mt-6">
                <Link href="/login">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-4 md:px-6 py-2 md:py-3 text-base md:text-lg shadow-lg">
                    우리반 멤버로 로그인하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공지사항 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📌 우리반 소식
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {boardNotices.length > 0 ? (
            boardNotices.map((notice) => (
              <Link key={notice.id} href={notice.link} className="block">
                <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={`${notice.boardColor} text-white text-xs`}>
                      {notice.boardName}
                    </Badge>
                    <span className="font-medium hover:text-blue-600 transition-colors">
                      {notice.title}
                    </span>
                    <Badge className="bg-yellow-500 text-white text-xs">
                      📌 공지
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(notice.createdAt)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              아직 공지사항이 없습니다. 공지로 등록된 게시글이 여기에 표시됩니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* HOT 게시물 섹션 */}
      {hotPosts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔥 지금 뜨는 글
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotPosts.map((post) => (
              <Link key={post.id} href={`/1-8/${post.board}/${post.id}`} className="block">
                <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={`${post.boardColor} text-white text-xs`}>
                      {post.boardName}
                    </Badge>
                    <Badge className="bg-red-500 text-white text-xs">
                      HOT
                    </Badge>
                    <span className="font-medium hover:text-red-600 transition-colors">
                      {post.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>조회 {post.views || 0}</span>
                    <span>{post.createdAt ? formatTime(post.createdAt) : post.time}</span>
                  </div>
                </div>
              </Link>
            ))}
            {hotPosts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                아직 인기 게시글이 없습니다. 글을 읽고 조회수를 올려보세요! 📈
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 추억 게시판 미리보기 */}
      <Card className="border-pink-200 bg-pink-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Link href="/1-8/memories" className="flex items-center gap-2 hover:text-pink-600 transition-colors">
              📸 우리반 추억
            </Link>
            <Link href="/1-8/memories">
              <Button variant="outline" size="sm" className="border-pink-300 text-pink-600 hover:bg-pink-50">더보기</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {memoryPosts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {memoryPosts.map((post: any) => (
                <Link key={post.id} href={`/1-8/memories/${post.id}`} className="flex-shrink-0">
                  <div className="w-64 bg-white hover:bg-pink-25 border border-pink-100 rounded-lg p-3 hover:shadow-md transition-all duration-200 group">
                    {post.imageData && (
                      <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={post.imageData}
                          alt={post.title}
                          width={256}
                          height={128}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <h3 className="font-medium text-sm text-pink-700 hover:text-pink-800 line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                        {(post.comments || 0) > 0 && (
                          <span className="flex items-center gap-1 text-blue-500 text-xs flex-shrink-0">
                            <MessageSquare className="h-3 w-3" />
                            {post.comments}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {post.content.length > 80 ? `${post.content.substring(0, 80)}...` : post.content}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-pink-100">
                        <span className="font-medium">{(post.isAnonymous || post.anonymous) ? '익명' : post.author}</span>
                        <div className="flex items-center gap-2">
                          {(post.likes || 0) > 0 && (
                            <span className="flex items-center gap-1 text-pink-500">
                              <Heart className="h-3 w-3" />
                              {post.likes}
                            </span>
                          )}
                          <span>{formatTime(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-3">📸</div>
              <p className="text-sm">아직 추억이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">첫 번째 추억을 만들어보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 게시판 탭 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Link href="/1-8/free" className="hover:text-blue-600 transition-colors">
                자유게시판
              </Link>
              <Link href="/1-8/free">
                <Button variant="outline" size="sm">더보기</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dynamicPosts.free.map((post: any) => (
              <Link key={post.id} href={`/1-8/free/${post.id}`} className="block">
                <div className="space-y-1 hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="font-medium text-sm hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    {post.title}
                    <span className="flex items-center gap-1 text-blue-500 text-xs">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{(post.anonymous || post.isAnonymous) ? '익명' : post.author}</span>
                    <div className="flex items-center gap-2">
                      <span>{post.createdAt ? formatTime(post.createdAt) : post.time}</span>
                      <span>조회 {post.views || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Link href="/1-8/assignment" className="hover:text-green-600 transition-colors">
                수행평가
              </Link>
              <Link href="/1-8/assignment">
                <Button variant="outline" size="sm">더보기</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dynamicPosts.assignment.map((post: any) => (
              <Link key={post.id} href={`/1-8/assignment/${post.id}`} className="block">
                <div className="space-y-1 hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="font-medium text-sm hover:text-green-600 cursor-pointer flex items-center gap-2">
                    {post.title}
                    <span className="flex items-center gap-1 text-blue-500 text-xs">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{(post.anonymous || post.isAnonymous) ? '익명' : post.author}</span>
                    <div className="flex items-center gap-2">
                      <span>{post.createdAt ? formatTime(post.createdAt) : post.time}</span>
                      <span>조회 {post.views || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Link href="/1-8/exam" className="hover:text-purple-600 transition-colors">
                지필평가
              </Link>
              <Link href="/1-8/exam">
                <Button variant="outline" size="sm">더보기</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dynamicPosts.exam.map((post: any) => (
              <Link key={post.id} href={`/1-8/exam/${post.id}`} className="block">
                <div className="space-y-1 hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="font-medium text-sm hover:text-purple-600 cursor-pointer flex items-center gap-2">
                    {post.title}
                    <span className="flex items-center gap-1 text-blue-500 text-xs">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{(post.anonymous || post.isAnonymous) ? '익명' : post.author}</span>
                    <div className="flex items-center gap-2">
                      <span>{post.createdAt ? formatTime(post.createdAt) : post.time}</span>
                      <span>조회 {post.views || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}