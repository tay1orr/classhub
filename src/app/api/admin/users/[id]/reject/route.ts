import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const userId = params.id;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isApproved: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: '이미 승인된 사용자는 거부할 수 없습니다. 삭제 기능을 사용하세요.' },
        { status: 400 }
      );
    }

    // 관리자는 거부할 수 없음
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: '관리자는 거부할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 삭제 (거부 = 삭제)
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log('❌ 사용자 가입 거부 (삭제):', user);

    return NextResponse.json({
      success: true,
      message: `${user.name}님의 가입 신청이 거부되어 삭제되었습니다.`,
      rejectedUser: user
    });

  } catch (error: any) {
    console.error('User rejection error:', error);
    return NextResponse.json(
      { error: '사용자 거부 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}