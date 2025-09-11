import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: '사용자 ID 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🔄 승인대기로 되돌릴 사용자 ID들:', userIds);

    // 관리자가 아닌 승인된 사용자들을 찾기
    const usersToRevert = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isApproved: true,
        role: 'STUDENT'  // 관리자는 제외
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true
      }
    });

    if (usersToRevert.length === 0) {
      return NextResponse.json(
        { error: '되돌릴 수 있는 사용자가 없습니다. (승인된 학생만 가능)' },
        { status: 400 }
      );
    }

    console.log('📋 되돌릴 사용자들:', usersToRevert);

    // 사용자들을 승인대기 상태로 변경
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: usersToRevert.map(u => u.id) }
      },
      data: {
        isApproved: false
      }
    });

    console.log('✅ 승인대기 상태로 되돌리기 완료:', updateResult.count, '명');

    const response = NextResponse.json({
      success: true,
      message: `${updateResult.count}명의 사용자가 승인대기 상태로 되돌려졌습니다.`,
      revertedCount: updateResult.count,
      revertedUsers: usersToRevert.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // 캐시 완전 비활성화 헤더 설정
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('Revert to pending error:', error);
    return NextResponse.json(
      { error: '사용자 상태 되돌리기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}