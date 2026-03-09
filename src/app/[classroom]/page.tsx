import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import { CLASS_CONFIG } from '@/lib/config'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Heart, Flame, Pin, ChevronRight } from 'lucide-react'
import HeroSlideshow from '@/components/HeroSlideshow'

const BOARD_META: Record<string, { label: string; color: string }> = {
  free:       { label: '자유게시판',    color: 'bg-blue-500' },
  evaluation: { label: '수행/지필평가', color: 'bg-green-500' },
  suggestion: { label: '건의사항',      color: 'bg-purple-500' },
  memories:   { label: '우리반 추억',   color: 'bg-pink-500' },
}

async function fetchHomePosts() {
  const classroom = await prisma.classroom.findUnique({
    where: { grade_classNo: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo } },
  })
  if (!classroom) return []

  return prisma.post.findMany({
    where: { classroomId: classroom.id, deletedAt: null },
    select: {
      id: true, title: true, isAnonymous: true, isPinned: true,
      views: true, likesCount: true, createdAt: true,
      author: { select: { name: true } },
      board: { select: { key: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })
}

export default async function ClassroomHome() {
  const [postsRaw, user] = await Promise.all([fetchHomePosts(), getServerSession()])

  const posts = postsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    author: p.author.name,
    isAnonymous: p.isAnonymous,
    board: p.board.key.toLowerCase(),
    views: p.views,
    likes: p.likesCount,
    comments: p._count.comments,
    isPinned: p.isPinned,
    createdAt: p.createdAt.toISOString(),
  }))

  const notices = posts.filter((p) => p.isPinned).slice(0, 5)

  // 점수 = 조회수 + 좋아요×3 + 댓글×2 - 경과시간(시간)×1.5 (최근 글 우대)
  const hotPosts = [...posts]
    .filter((p) => !p.isPinned)
    .map((p) => {
      const hoursAgo = (Date.now() - new Date(p.createdAt).getTime()) / 3600000
      const score = p.views + p.likes * 3 + p.comments * 2 - hoursAgo * 1.5
      return { ...p, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const byBoard = (board: string) => posts.filter((p) => p.board === board).slice(0, 5)

  return (
    <div className="space-y-6">
      <HeroSlideshow loggedIn={!!user} />

      {/* 공지사항 */}
      <Section title="📌 공지사항">
        {notices.length > 0
          ? notices.map((p) => <PostRow key={p.id} post={p} showBadge />)
          : <Empty text="등록된 공지사항이 없습니다" />}
      </Section>

      {/* HOT 게시물 */}
      {hotPosts.length > 0 && (
        <Section title="🔥 지금 뜨는 글">
          {hotPosts.map((p) => <PostRow key={p.id} post={p} showViews showBadge />)}
        </Section>
      )}

      {/* 게시판 3열 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {(['free', 'evaluation', 'suggestion'] as const).map((board) => (
          <div key={board} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Link href={`/${CLASS_CONFIG.slug}/${board}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                {BOARD_META[board].label}
              </Link>
              <Link href={`/${CLASS_CONFIG.slug}/${board}`} className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                더보기 <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y">
              {byBoard(board).length > 0
                ? byBoard(board).map((p) => <PostRow key={p.id} post={p} compact />)
                : <Empty text="아직 게시글이 없습니다" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function PostRow({ post, showBadge, showViews, compact }: {
  post: { id: string; title: string; board: string; isAnonymous: boolean; isPinned: boolean; views: number; likes: number; comments: number; createdAt: string }
  showBadge?: boolean; showViews?: boolean; compact?: boolean
}) {
  const meta = BOARD_META[post.board]
  return (
    <Link href={`/${CLASS_CONFIG.slug}/${post.board}/${post.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        {showBadge && meta && (
          <span className={`shrink-0 text-xs text-white px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
        )}
        {post.isPinned && <Pin className="h-3 w-3 text-yellow-500 shrink-0" />}
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
          <span className="flex items-center gap-0.5 text-pink-400"><Heart className="h-3 w-3" />{post.likes}</span>
        )}
        {showViews && (
          <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-400" />{post.views}</span>
        )}
        <span>{formatRelativeTime(post.createdAt)}</span>
      </div>
    </Link>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-sm text-center text-gray-400">{text}</p>
}
