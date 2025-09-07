import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const { role } = await request.json();
    const userId = params.id;

    // 입력 검증
    if (!role || !['ADMIN', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: '유효한 역할을 지정해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인 및 권한 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    console.log('✅ 사용자 권한 변경:', updatedUser);

    return NextResponse.json({
      success: true,
      message: `사용자 권한이 ${role}로 변경되었습니다.`,
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: '사용자 권한 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}