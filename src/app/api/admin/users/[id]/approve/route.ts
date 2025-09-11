import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  console.log('🚀 승인 API 호출 시작:', {
    userId: params.id,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });

  try {
    const userId = params.id;
    console.log('🔍 사용자 ID 검증:', { userId, type: typeof userId });

    // 연결 상태 확인
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ 데이터베이스 연결 확인됨');
    } catch (dbError: any) {
      console.error('❌ 데이터베이스 연결 실패:', dbError);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // 사용자 정보 조회
    console.log('🔍 사용자 조회 중...');
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

    // 이미 승인된 경우 로그만 남기고 계속 진행 (강제 업데이트)
    if (user.isApproved) {
      console.log('⚠️ 이미 승인된 사용자이지만 강제 업데이트 진행:', user.name);
    }

    // 트랜잭션으로 강력한 업데이트 보장
    console.log('🔄 트랜잭션 시작...');
    const updatedUser = await prisma.$transaction(async (tx) => {
      console.log('🔄 트랜잭션 내부 - 데이터베이스 연결 새로고침...');
      
      // 현재 상태 확인
      console.log('📊 트랜잭션 내부 - 현재 상태 확인...');
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { isApproved: true, name: true, updatedAt: true }
      });
      
      console.log('📊 트랜잭션 내부 - 현재 상태:', currentUser);
      
      if (!currentUser) {
        throw new Error('사용자를 찾을 수 없습니다 (트랜잭션 내부)');
      }
      
      // 강제 업데이트 (이미 승인되었어도 다시 업데이트)
      console.log('🔄 트랜잭션 내부 - 강제 업데이트 시작...');
      const updateTime = new Date();
      const updated = await tx.user.update({
        where: { id: userId },
        data: { 
          isApproved: true,
          updatedAt: updateTime
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
      
      console.log('✅ 트랜잭션 내부 - 업데이트 완료:', {
        id: updated.id,
        name: updated.name,
        isApproved: updated.isApproved,
        updatedAt: updated.updatedAt
      });
      
      return updated;
    }, {
      timeout: 10000, // 10초 타임아웃
      maxWait: 5000   // 최대 5초 대기
    });

    const processingTime = Date.now() - startTime;
    console.log('✅ 사용자 승인 완료 (트랜잭션):', updatedUser);
    console.log('🔄 승인 상태 확인:', updatedUser.isApproved ? '승인됨' : '승인대기');
    console.log('⏱️ 처리 시간:', processingTime + 'ms');

    const response = NextResponse.json({
      success: true,
      message: `${updatedUser.name}님이 승인되었습니다.`,
      user: updatedUser,
      processingTime,
      timestamp: new Date().toISOString()
    });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // 캐시 완전 비활성화 헤더 설정
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('❌ User approval error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      userId: params.id,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: '사용자 승인 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'production' ? undefined : error.message 
      },
      { status: 500 }
    );
  } finally {
    // 공용 prisma 인스턴스이므로 disconnect 하지 않음
    console.log('🔄 승인 처리 완료');
  }
}