export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const commentId = params.id
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })
    if (!comment) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })

    if (comment.authorId !== session.id && session.role !== 'ADMIN') {
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
