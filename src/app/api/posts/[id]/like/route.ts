export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const postId = params.id
    const userId = session.id

    const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
      ])
    } else {
      await prisma.$transaction([
        prisma.postLike.create({ data: { userId, postId, isLike: true } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
      ])
    }

    const updated = await prisma.post.findUnique({
      where: { id: postId },
      select: { likesCount: true, likes: { where: { userId }, select: { id: true } } },
    })

    return NextResponse.json({
      success: true,
      likes: updated?.likesCount ?? 0,
      liked: (updated?.likes.length ?? 0) > 0,
    })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: '좋아요 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
