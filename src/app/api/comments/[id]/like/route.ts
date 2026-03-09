export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const commentId = params.id
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 400 })

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } }),
      ])
      return NextResponse.json({ success: true, liked: false })
    } else {
      const [, updated] = await prisma.$transaction([
        prisma.commentLike.create({ data: { userId, commentId } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
      ])
      return NextResponse.json({ success: true, liked: true, likesCount: updated.likesCount })
    }
  } catch (error: any) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
