import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    // 모든 사용자 조회 (비밀번호 제외)
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

    console.log('✅ 사용자 목록 조회:', users.length, '명');

    return NextResponse.json({
      success: true,
      users: users,
      totalUsers: users.length
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}