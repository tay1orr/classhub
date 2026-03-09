export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const posts = await prisma.post.findMany({
      where: { authorId: session.id, deletedAt: null },
      select: {
        id: true, title: true, isAnonymous: true, views: true,
        likesCount: true, createdAt: true,
        board: { select: { key: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      user: { id: session.id, name: session.name, email: session.email, role: session.role },
      posts: posts.map((p) => ({
        id: p.id, title: p.title, isAnonymous: p.isAnonymous,
        board: p.board.key.toLowerCase(), views: p.views,
        likes: p.likesCount, comments: p._count.comments,
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: '불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
