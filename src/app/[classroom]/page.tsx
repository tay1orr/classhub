'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth-client'
import { CLASS_CONFIG } from '@/lib/config'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Heart, Flame, Pin, ChevronRight } from 'lucide-react'

interface Post {
  id: string
  title: string
  author: string
  board: string
  views: number
  likes: number
  comments: number
  isPinned: boolean
  createdAt: string
}

const BOARD_META: Record<string, { label: string; color: string; href: string }> = {
  free:       { label: '자유게시판',    color: 'bg-blue-500',   href: `/${CLASS_CONFIG.slug}/free` },
  evaluation: { label: '수행/지필평가', color: 'bg-green-500',  href: `/${CLASS_CONFIG.slug}/evaluation` },
  suggestion: { label: '건의사항',      color: 'bg-purple-500', href: `/${CLASS_CONFIG.slug}/suggestion` },
  memories:   { label: '우리반 추억',   color: 'bg-pink-500',   href: `/${CLASS_CONFIG.slug}/memories` },
}

const images = ['/images/class.jpg', '/images/class2.jpg']

export default function ClassroomHome() {
  const [user, setUser] = useState(getSession())
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?limit=50', { cache: 'no-store' })
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    const imgTimer = setInterval(() => setImgIdx((i) => (i + 1) % images.length), 5000)
    return () => clearInterval(imgTimer)
  }, [fetchPosts])

  const notices = posts.filter((p) => p.isPinned).slice(0, 5)
  const hotPosts = [...posts].filter((p) => p.views > 0).sort((a, b) => b.views - a.views).slice(0, 3)
  const byBoard = (board: string) => posts.filter((p) => p.board === board).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 히어로 이미지 */}
      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-lg">
        {images.map((src, i) => (
          <Image key={src} src={src} alt={`${CLASS_CONFIG.displayName} 사진`} fill
            className={`object-cover transition-opacity duration-1000 ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`}
            priority={i === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
            {CLASS_CONFIG.displayName}
          </h1>
          <p className="mt-3 text-lg text-white/90 drop-shadow">우리만의 특별한 공간</p>
          {!user && (
            <Link href="/login" className="mt-6 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-colors">
              로그인하기
            </Link>
          )}
        </div>
        {/* 이미지 인디케이터 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => setImgIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* 공지사항 */}
      <Section title="📌 공지사항" href={notices.length > 0 ? undefined : undefined}>
        {isLoading ? <LoadingRows /> : notices.length > 0 ? (
          notices.map((p) => (
            <PostRow key={p.id} post={p} showBadge />
          ))
        ) : (
          <Empty text="등록된 공지사항이 없습니다" />
        )}
      </Section>

      {/* HOT 게시물 */}
      {hotPosts.length > 0 && (
        <Section title="🔥 지금 뜨는 글">
          {hotPosts.map((p) => (
            <PostRow key={p.id} post={p} showViews showBadge />
          ))}
        </Section>
      )}

      {/* 게시판 3열 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {(['free', 'evaluation', 'suggestion'] as const).map((board) => {
          const meta = BOARD_META[board]
          return (
            <div key={board} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <Link href={meta.href} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                  {meta.label}
                </Link>
                <Link href={meta.href} className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                  더보기 <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y">
                {isLoading ? <LoadingRows /> : byBoard(board).length > 0 ? (
                  byBoard(board).map((p) => <PostRow key={p.id} post={p} compact />)
                ) : (
                  <Empty text="아직 게시글이 없습니다" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 하위 컴포넌트 ───────────────────────────────

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-blue-600 transition-colors">
            더보기 <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function PostRow({ post, showBadge, showViews, compact }: {
  post: Post
  showBadge?: boolean
  showViews?: boolean
  compact?: boolean
}) {
  const meta = BOARD_META[post.board]
  const href = `/${CLASS_CONFIG.slug}/${post.board}/${post.id}`

  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        {showBadge && meta && (
          <span className={`shrink-0 text-xs text-white px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}
          </span>
        )}
        {post.isPinned && (
          <Pin className="h-3 w-3 text-yellow-500 shrink-0" />
        )}
        <span className={`truncate group-hover:text-blue-600 transition-colors ${compact ? 'text-sm' : 'text-sm font-medium'}`}>
          {post.title}
        </span>
        {post.comments > 0 && (
          <span className="shrink-0 flex items-center gap-0.5 text-xs text-blue-400">
            <MessageSquare className="h-3 w-3" />{post.comments}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400 ml-2">
        {post.likes > 0 && (
          <span className="flex items-center gap-0.5 text-pink-400">
            <Heart className="h-3 w-3" />{post.likes}
          </span>
        )}
        {showViews && (
          <span className="flex items-center gap-0.5">
            <Flame className="h-3 w-3 text-orange-400" />{post.views}
          </span>
        )}
        <span>{formatRelativeTime(post.createdAt)}</span>
      </div>
    </Link>
  )
}

function LoadingRows() {
  return (
    <div className="px-4 py-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-sm text-center text-gray-400">{text}</p>
}
