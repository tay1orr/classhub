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
    // 테스트 사용자들 생성
    const testUsers = [
      {
        id: 'test_user_1',
        name: '김영민',
        email: 'kimyoungmin@test.com',
        role: 'STUDENT',
        isApproved: false
      },
      {
        id: 'test_user_2',
        name: '이민수',
        email: 'leemin@test.com',
        role: 'STUDENT',
        isApproved: false
      },
      {
        id: 'test_user_3',
        name: '박지은',
        email: 'parkji@test.com',
        role: 'STUDENT',
        isApproved: false
      }
    ];

    // 기존 테스트 사용자들 삭제
    await prisma.user.deleteMany({
      where: {
        OR: testUsers.map(user => ({ id: user.id }))
      }
    });

    // 새로운 테스트 사용자들 생성
    const createdUsers = await prisma.user.createMany({
      data: testUsers,
      skipDuplicates: true
    });

    console.log('✅ 테스트 사용자 생성:', createdUsers);

    const response = NextResponse.json({
      success: true,
      message: `${testUsers.length}명의 테스트 사용자가 생성되었습니다.`,
      createdCount: createdUsers.count
    });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    return response;

  } catch (error: any) {
    console.error('Create test users error:', error);
    return NextResponse.json(
      { error: '테스트 사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}