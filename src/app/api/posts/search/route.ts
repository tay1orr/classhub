export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CLASS_CONFIG } from '@/lib/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const boardKey = searchParams.get('board')

    if (!q || q.length < 2) {
      return NextResponse.json({ posts: [] })
    }

    const classroom = await prisma.classroom.findUnique({
      where: { grade_classNo: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo } },
    })
    if (!classroom) return NextResponse.json({ posts: [] })

    const posts = await prisma.post.findMany({
      where: {
        classroomId: classroom.id,
        deletedAt: null,
        ...(boardKey ? { board: { key: boardKey.toUpperCase() } } : {}),
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      select: {
        id: true, title: true, content: true, isAnonymous: true, isPinned: true,
        views: true, likesCount: true, createdAt: true,
        author: { select: { name: true } },
        board: { select: { key: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id, title: p.title,
        content: p.content.length > 100 ? p.content.slice(0, 100) + '...' : p.content,
        author: p.author.name, isAnonymous: p.isAnonymous, isPinned: p.isPinned,
        board: p.board.key.toLowerCase(), views: p.views,
        likes: p.likesCount, comments: p._count.comments,
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
