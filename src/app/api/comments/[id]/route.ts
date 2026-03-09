import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const commentId = params.id

    if (!userId) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })
    if (!comment) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    const isAdmin = user?.role === 'ADMIN'

    if (comment.authorId !== userId && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.comment.updateMany({
      where: { OR: [{ id: commentId }, { parentId: commentId }] },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
