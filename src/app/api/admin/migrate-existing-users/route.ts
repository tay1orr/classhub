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
    // 승인된 학생들을 승인대기 상태로 되돌리기 (관리자 제외)
    const result = await prisma.user.updateMany({
      where: {
        isApproved: true,
        role: 'STUDENT'  // 관리자는 제외
      },
      data: {
        isApproved: false
      }
    });

    console.log('✅ 학생들 승인대기 상태로 되돌리기 완료:', result);

    const response = NextResponse.json({
      success: true,
      message: `${result.count}명의 학생이 승인대기 상태로 변경되었습니다.`,
      updatedCount: result.count
    });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // 캐시 완전 비활성화 헤더 설정
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('Migrate users error:', error);
    return NextResponse.json(
      { error: '사용자 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}