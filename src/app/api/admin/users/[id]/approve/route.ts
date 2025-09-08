import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    // 사용자 승인 및 권한 설정
    const approvedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: role,
        isApproved: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        updatedAt: true
      }
    });

    console.log('✅ 사용자 승인:', approvedUser);

    return NextResponse.json({
      success: true,
      message: `${approvedUser.name}님이 ${role === 'ADMIN' ? '관리자' : '학생'}로 승인되었습니다.`,
      user: approvedUser
    });

  } catch (error: any) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: '사용자 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}