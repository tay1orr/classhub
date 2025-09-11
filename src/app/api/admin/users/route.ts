import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel serverless 캐시 무효화를 위한 동적 응답
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log('🚀 사용자 목록 조회 API 호출:', {
    requestId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });

  try {
    // 캐시 문제 방지를 위해 강제 리프레시
    console.log('🔄 사용자 목록 조회 시작 - 캐시 우회 모드');

    // 연결 상태 확인 및 강제 새로고침
    try {
      await prisma.$queryRaw`SELECT NOW()`;
      console.log('✅ 데이터베이스 연결 및 현재 시간 확인됨');
    } catch (dbError: any) {
      console.error('❌ 데이터베이스 연결 실패:', dbError);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // 모든 사용자 조회 (비밀번호 제외) - 캐시 우회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const processingTime = Date.now() - startTime;
    console.log('✅ 사용자 목록 조회 완료:', users.length, '명');
    console.log('📊 승인 상태 요약:');
    console.log('   - 승인됨:', users.filter(u => u.isApproved).length, '명');
    console.log('   - 승인대기:', users.filter(u => !u.isApproved).length, '명');
    console.log('⏱️ 처리 시간:', processingTime + 'ms');

    const response = NextResponse.json({
      success: true,
      users: users,
      totalUsers: users.length,
      timestamp: new Date().toISOString(),
      requestId,
      processingTime,
      serverTime: new Date().toISOString()
    });

    // 강력한 캐시 방지 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Last-Modified', new Date().toUTCString());
    response.headers.set('ETag', `"${Date.now()}"`);

    return response;

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    // 공용 prisma 인스턴스이므로 disconnect 하지 않음
    console.log('🔄 사용자 목록 조회 완료');
  }
}