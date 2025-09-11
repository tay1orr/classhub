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
    const userId = params.id;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isApproved: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: '이미 승인된 사용자입니다.' },
        { status: 400 }
      );
    }

    // 사용자 승인 - 강제 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isApproved: true,
        updatedAt: new Date() // 강제 타임스탬프 업데이트
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ 사용자 승인 완료:', updatedUser);
    console.log('🔄 승인 상태 확인:', updatedUser.isApproved ? '승인됨' : '승인대기');

    const response = NextResponse.json({
      success: true,
      message: `${updatedUser.name}님이 승인되었습니다.`,
      user: updatedUser
    });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // 캐시 완전 비활성화 헤더 설정
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('User approval error:', error);
    return NextResponse.json(
      { error: '사용자 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}