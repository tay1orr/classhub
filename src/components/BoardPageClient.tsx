'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Heart, Eye, Pin, PenSquare, Search } from 'lucide-react'

interface Post {
  id: string
  title: string
  author: string
  isAnonymous: boolean
  board: string
  views: number
  likes: number
  comments: number
  isPinned: boolean
  createdAt: string
}

interface Pagination {
  page: number
  pages: number
  total: number
}

interface Props {
  boardKey: string
  title: string
  color: string
  emoji: string
  writeLabel?: string
  initialPosts: Post[]
  pagination: Pagination
  userLoggedIn: boolean
}

const colorMap: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
  green: 'text-green-600 bg-green-50 border-green-200',
  purple: 'text-purple-600 bg-purple-50 border-purple-200',
  pink: 'text-pink-600 bg-pink-50 border-pink-200',
}
const btnMap: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  pink: 'bg-pink-600 hover:bg-pink-700',
}

export default function BoardPageClient({ boardKey, title, color, emoji, writeLabel = '글쓰기', initialPosts, pagination, userLoggedIn }: Props) {
  const params = useParams()
  const classroom = params.classroom as string
  const boardSlug = boardKey.toLowerCase()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Post[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!search.trim() || search.trim().length < 2) { setSearchResults(null); return }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/posts/search?q=${encodeURIComponent(search)}&board=${boardKey}`)
        const data = await res.json()
        setSearchResults(data.posts || [])
      } catch { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 300)
  }, [search, boardKey])

  const displayed = searchResults ?? initialPosts
  const pinned = searchResults ? [] : displayed.filter((p) => p.isPinned)
  const normal = searchResults ? displayed : displayed.filter((p) => !p.isPinned)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* 헤더 */}
      <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.blue}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{emoji} {title}</h1>
            <p className="text-sm opacity-70 mt-1">총 {pagination.total}개의 게시글</p>
          </div>
          {userLoggedIn && (
            <Link href={`/${classroom}/${boardSlug}/write`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${btnMap[color] || btnMap.blue}`}>
              <PenSquare className="h-4 w-4" />{writeLabel}
            </Link>
          )}
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="제목 검색 (전체 글 대상)..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">검색 중...</span>}
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{emoji}</div>
            <p>{search ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}</p>
            {userLoggedIn && !search && (
              <Link href={`/${classroom}/${boardSlug}/write`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                첫 번째 글을 작성해보세요!
              </Link>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="border-b">
                {pinned.map((p) => <PostRow key={p.id} post={p} classroom={classroom} boardSlug={boardSlug} />)}
              </div>
            )}
            <div className="divide-y">
              {normal.map((p) => <PostRow key={p.id} post={p} classroom={classroom} boardSlug={boardSlug} />)}
            </div>
          </>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/${classroom}/${boardSlug}?page=${p}`}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                p === pagination.page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function PostRow({ post, classroom, boardSlug }: { post: Post; classroom: string; boardSlug: string }) {
  return (
    <Link href={`/${classroom}/${boardSlug}/${post.id}`}
      className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        {post.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
        <span className={`truncate text-sm group-hover:text-blue-600 transition-colors ${post.isPinned ? 'font-semibold' : ''}`}>
          {post.title}
        </span>
        {post.comments > 0 && (
          <span className="shrink-0 flex items-center gap-0.5 text-xs text-blue-400">
            <MessageSquare className="h-3 w-3" />{post.comments}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-4 text-xs text-gray-400 ml-3">
        <span className="hidden sm:block">{post.isAnonymous ? '익명' : post.author}</span>
        {post.likes > 0 && (
          <span className="flex items-center gap-0.5 text-pink-400">
            <Heart className="h-3 w-3" />{post.likes}
          </span>
        )}
        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.views}</span>
        <span className="hidden sm:block">{formatRelativeTime(post.createdAt)}</span>
      </div>
    </Link>
  )
}
