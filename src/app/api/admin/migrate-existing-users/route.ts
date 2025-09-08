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
    // 기존 사용자들 중 isApproved가 false인 사용자들을 true로 업데이트
    const result = await prisma.user.updateMany({
      where: {
        isApproved: false,
        // 생성일이 특정 날짜 이전인 사용자들만 (승인 시스템 도입 이전)
        createdAt: {
          lt: new Date('2025-09-08') // 오늘 이전에 생성된 사용자들
        }
      },
      data: {
        isApproved: true
      }
    });

    console.log('✅ 기존 사용자 승인 완료:', result);

    return NextResponse.json({
      success: true,
      message: `${result.count}명의 기존 사용자가 자동 승인되었습니다.`,
      updatedCount: result.count
    });

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