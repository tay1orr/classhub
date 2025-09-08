import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    // 기존 사용자들의 isApproved 필드를 true로 설정
    // (기존 사용자들은 이미 사용하고 있었으므로 승인된 것으로 간주)
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { isApproved: null },
          { isApproved: false }
        ]
      },
      data: {
        isApproved: true
      }
    });

    // 관리자 이메일들은 확실히 ADMIN 역할과 승인 상태로 설정
    const adminEmails = [
      'taylorr@gclass.ice.go.kr',
      'admin@classhub.co.kr',
      'taylorr@naver.com'
    ];

    for (const email of adminEmails) {
      await prisma.user.updateMany({
        where: { email },
        data: {
          role: 'ADMIN',
          isApproved: true
        }
      });
    }

    console.log('Migration completed:', result);

    return NextResponse.json({
      success: true,
      message: 'User migration completed successfully',
      updatedCount: result.count
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}