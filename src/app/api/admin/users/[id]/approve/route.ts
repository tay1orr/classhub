import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.user.update({
      where: { id: params.id },
      data: { isApproved: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '승인 처리에 실패했습니다.' }, { status: 500 })
  }
}
