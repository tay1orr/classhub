import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import { CLASS_CONFIG } from '@/lib/config'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Heart, Eye, User } from 'lucide-react'

const BOARD_LABEL: Record<string, string> = {
  free: '자유게시판', evaluation: '수행/지필평가',
  suggestion: '건의사항', memories: '우리반 추억',
}

async function fetchMyPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId, deletedAt: null },
    select: {
      id: true, title: true, isAnonymous: true, views: true,
      likesCount: true, createdAt: true,
      board: { select: { key: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return posts.map((p) => ({
    id: p.id, title: p.title, isAnonymous: p.isAnonymous,
    board: p.board.key.toLowerCase(), views: p.views,
    likes: p.likesCount, comments: p._count.comments,
    createdAt: p.createdAt.toISOString(),
  }))
}

export default async function MyPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const posts = await fetchMyPosts(session.id)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 프로필 */}
      <div className="bg-white rounded-xl border shadow-sm p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
          {session.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{session.name}</h1>
          <p className="text-sm text-gray-400">{session.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
            session.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {session.role === 'ADMIN' ? '관리자' : '학생'}
          </span>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '작성한 글', value: posts.length, icon: '📝' },
          { label: '받은 좋아요', value: posts.reduce((s, p) => s + p.likes, 0), icon: '❤️' },
          { label: '총 조회수', value: posts.reduce((s, p) => s + p.views, 0), icon: '👀' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 내가 쓴 글 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">내가 쓴 글 ({posts.length})</h2>
        </div>
        {posts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>아직 작성한 글이 없습니다</p>
            <Link href={`/${CLASS_CONFIG.slug}/free/write`} className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              첫 글 쓰러 가기
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <Link key={post.id} href={`/${CLASS_CONFIG.slug}/${post.board}/${post.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400">{BOARD_LABEL[post.board]}</span>
                  </div>
                  <p className="text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400 ml-4">
                  {post.likes > 0 && (
                    <span className="flex items-center gap-0.5 text-pink-400">
                      <Heart className="h-3 w-3" />{post.likes}
                    </span>
                  )}
                  {post.comments > 0 && (
                    <span className="flex items-center gap-0.5 text-blue-400">
                      <MessageSquare className="h-3 w-3" />{post.comments}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />{post.views}
                  </span>
                  <span className="hidden sm:block">{formatRelativeTime(post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
