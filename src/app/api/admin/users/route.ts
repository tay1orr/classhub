import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
      orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '사용자 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
