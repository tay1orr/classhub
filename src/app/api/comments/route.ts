import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId가 필요합니다.' }, { status: 400 })

    const comments = await prisma.comment.findMany({
      where: { postId, deletedAt: null, parentId: null },
      select: {
        id: true,
        content: true,
        isAnonymous: true,
        likesCount: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
        replies: {
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            isAnonymous: true,
            likesCount: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: c.isAnonymous ? '익명' : c.author.name,
      authorId: c.author.id,
      isAnonymous: c.isAnonymous,
      likes: c.likesCount,
      createdAt: c.createdAt.toISOString(),
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        author: r.isAnonymous ? '익명' : r.author.name,
        authorId: r.author.id,
        isAnonymous: r.isAnonymous,
        likes: r.likesCount,
        createdAt: r.createdAt.toISOString(),
      })),
    }))

    return NextResponse.json({ comments: formatted })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: '댓글을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { postId, authorId, content, isAnonymous, parentId } = await request.json()

    if (!postId || !authorId || !content?.trim()) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true, name: true, isApproved: true } })
    if (!author || !author.isApproved) {
      return NextResponse.json({ error: '댓글 작성 권한이 없습니다.' }, { status: 403 })
    }

    const comment = await prisma.comment.create({
      data: { postId, authorId, content: content.trim(), isAnonymous: isAnonymous || false, parentId: parentId || null },
      select: {
        id: true,
        content: true,
        isAnonymous: true,
        likesCount: true,
        parentId: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        author: comment.isAnonymous ? '익명' : comment.author.name,
        authorId: comment.author.id,
        isAnonymous: comment.isAnonymous,
        likes: comment.likesCount,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        replies: [],
      },
    })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
