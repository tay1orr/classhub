import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {

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

    // 이미 승인된 경우 로그만 남기고 계속 진행 (강제 업데이트)
    if (user.isApproved) {
      console.log('⚠️ 이미 승인된 사용자이지만 강제 업데이트 진행:', user.name);
    }

    // 트랜잭션으로 강력한 업데이트 보장
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 강제 연결 새로고침
      console.log('🔄 데이터베이스 연결 새로고침...');
      
      // 현재 상태 확인
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { isApproved: true, name: true }
      });
      
      console.log('📊 현재 상태:', currentUser);
      
      // 강제 업데이트 (이미 승인되었어도 다시 업데이트)
      const updated = await tx.user.update({
        where: { id: userId },
        data: { 
          isApproved: true,
          updatedAt: new Date()
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
      
      return updated;
    });

    console.log('✅ 사용자 승인 완료 (트랜잭션):', updatedUser);
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
    // 공용 prisma 인스턴스이므로 disconnect 하지 않음
    console.log('🔄 승인 처리 완료');
  }
}