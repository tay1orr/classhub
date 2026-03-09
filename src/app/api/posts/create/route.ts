import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CLASS_CONFIG } from '@/lib/config'

export const dynamic = 'force-dynamic'

// 보드와 교실이 없으면 자동 생성
async function ensureClassroomAndBoards() {
  // 교실 upsert
  const classroom = await prisma.classroom.upsert({
    where: { grade_classNo: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo } },
    update: {},
    create: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo, name: CLASS_CONFIG.displayName },
  })

  // 게시판 upsert
  const boards = [
    { key: 'FREE', name: '자유게시판' },
    { key: 'EVALUATION', name: '수행/지필평가' },
    { key: 'SUGGESTION', name: '건의사항' },
    { key: 'MEMORIES', name: '우리반 추억' },
  ]
  for (const b of boards) {
    await prisma.board.upsert({
      where: { key: b.key },
      update: {},
      create: b,
    })
  }

  return classroom
}

export async function POST(request: Request) {
  try {
    const { title, content, authorId, boardKey, isAnonymous, isPinned, imageData } = await request.json()

    if (!title?.trim() || !content?.trim() || !authorId || !boardKey) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const classroom = await ensureClassroomAndBoards()

    const board = await prisma.board.findUnique({ where: { key: boardKey.toUpperCase() } })
    if (!board) {
      return NextResponse.json({ error: `게시판(${boardKey})을 찾을 수 없습니다.` }, { status: 404 })
    }

    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true, isApproved: true } })
    if (!author || !author.isApproved) {
      return NextResponse.json({ error: '게시글 작성 권한이 없습니다.' }, { status: 403 })
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId,
        boardId: board.id,
        classroomId: classroom.id,
        isAnonymous: isAnonymous || false,
        isPinned: isPinned || false,
        image: imageData || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        board: { select: { key: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        board: post.board.key.toLowerCase(),
        createdAt: post.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
