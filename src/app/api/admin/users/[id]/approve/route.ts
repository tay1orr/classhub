export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    await prisma.user.update({ where: { id: params.id }, data: { isApproved: true } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '승인 처리에 실패했습니다.' }, { status: 500 })
  }
}
