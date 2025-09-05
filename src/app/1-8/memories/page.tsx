'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Heart, MessageSquare, ArrowLeft, Camera } from 'lucide-react'
import { getCurrentUser, isAdmin } from '@/lib/simple-auth'

export default function MemoriesPage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setUser(getCurrentUser())
    
    const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
    const memoryPosts = storedPosts
      .filter((post: any) => post.board === 'memories')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    setPosts(memoryPosts)
    setFilteredPosts(memoryPosts)

    // 시간 업데이트
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(posts)
    }
  }, [searchTerm, posts])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = currentTime
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days >= 7) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).replace(/\. /g, '. ')
    }
    
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/1-8" className="flex items-center gap-2 text-pink-600 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            우리반으로 돌아가기
          </Link>
        </div>
      </div>

      {/* 제목 및 설명 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-pink-600">📸 우리반 추억</h1>
        <p className="text-gray-600 dark:text-gray-400">1학년 8반의 소중한 순간들을 함께 나누어요</p>
      </div>

      {/* 검색 및 글쓰기 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="추억 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          {user ? (
            <Link href="/1-8/memories/write">
              <Button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600">
                <Camera className="h-4 w-4" />
                추억 올리기
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600">
                <Camera className="h-4 w-4" />
                로그인 후 추억 올리기
              </Button>
            </Link>
          )}

          {user && isAdmin(user) && (
            <Link href="/1-8/memories/manage">
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                추억 관리
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 추억 게시글 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-all duration-300 border-pink-100 overflow-hidden group">
              {/* 사진 */}
              {post.imageData && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.imageData}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* 배지들을 이미지 위에 오버레이 */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-pink-500/90 text-white backdrop-blur-sm">추억</Badge>
                    {post.isPinned && (
                      <Badge className="bg-yellow-500/90 text-white backdrop-blur-sm text-xs">
                        📌 고정
                      </Badge>
                    )}
                  </div>

                  {/* 시간 표시 */}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                      {formatTime(post.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              <CardContent className="p-4">
                <Link href={`/1-8/memories/${post.id}`} className="block">
                  <div className="space-y-3">
                    {/* 이미지가 없는 경우 헤더 */}
                    {!post.imageData && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-pink-500 text-white">추억</Badge>
                          {post.isPinned && (
                            <Badge className="bg-yellow-500 text-white text-xs">
                              📌 고정
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatTime(post.createdAt)}</span>
                      </div>
                    )}

                    {/* 제목 */}
                    <h2 className="text-lg font-semibold text-pink-700 hover:text-pink-800 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* 내용 미리보기 */}
                    <div className="text-gray-600 text-sm line-clamp-3">
                      {post.content.length > 80 ? `${post.content.substring(0, 80)}...` : post.content}
                    </div>

                    {/* 태그들 */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs border-pink-200 text-pink-600">
                            #{tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-pink-200 text-pink-600">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          {(post.isAnonymous || post.anonymous) ? '익명' : post.author}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-pink-500">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comments || 0}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">조회 {post.views || 0}</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? '검색 결과가 없습니다' : '아직 추억이 없습니다'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                {searchTerm ? '다른 키워드로 검색해보세요' : '우리반의 첫 번째 추억을 올려보세요!'}
              </p>
              {!searchTerm && user && (
                <Link href="/1-8/memories/write">
                  <Button className="bg-pink-500 hover:bg-pink-600">
                    <Camera className="h-4 w-4 mr-2" />
                    첫 추억 올리기
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}