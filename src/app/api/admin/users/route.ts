export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
      orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) })
  } catch (error) {
    return NextResponse.json({ error: '사용자 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
