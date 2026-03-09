export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import { CLASS_CONFIG } from '@/lib/config'

let cachedIds: { classroomId: string; boardIds: Record<string, string> } | null = null

async function getIds() {
  if (cachedIds) return cachedIds

  const [classroom, boards] = await Promise.all([
    prisma.classroom.upsert({
      where: { grade_classNo: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo } },
      update: {},
      create: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo, name: CLASS_CONFIG.displayName },
    }),
    Promise.all(
      [
        { key: 'FREE', name: '자유게시판' },
        { key: 'EVALUATION', name: '수행/지필평가' },
        { key: 'SUGGESTION', name: '건의사항' },
        { key: 'MEMORIES', name: '우리반 추억' },
      ].map((b) => prisma.board.upsert({ where: { key: b.key }, update: {}, create: b }))
    ),
  ])

  cachedIds = {
    classroomId: classroom.id,
    boardIds: Object.fromEntries(boards.map((b) => [b.key, b.id])),
  }
  return cachedIds
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!session.isApproved) return NextResponse.json({ error: '게시글 작성 권한이 없습니다.' }, { status: 403 })

    const { title, content, boardKey, isAnonymous, isPinned, imageData } = await request.json()
    if (!title?.trim() || !content?.trim() || !boardKey) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const { classroomId, boardIds } = await getIds()
    const boardId = boardIds[boardKey.toUpperCase()]
    if (!boardId) return NextResponse.json({ error: `게시판(${boardKey})을 찾을 수 없습니다.` }, { status: 404 })

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: session.id,
        boardId,
        classroomId,
        isAnonymous: isAnonymous || false,
        isPinned: isPinned && session.role === 'ADMIN',
        image: imageData || null,
      },
      select: { id: true, createdAt: true, board: { select: { key: true } } },
    })

    return NextResponse.json({
      success: true,
      post: { id: post.id, board: post.board.key.toLowerCase(), createdAt: post.createdAt.toISOString() },
    })
  } catch (error: any) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
