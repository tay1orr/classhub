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
    console.log('Auth test: Starting...');
    
    // 데이터베이스 연결 테스트
    await prisma.$connect();
    console.log('Auth test: Database connected');
    
    // 사용자 테이블 확인
    const userCount = await prisma.user.count();
    console.log('Auth test: User count:', userCount);
    
    return NextResponse.json({
      status: 'success',
      message: 'Authentication API test successful',
      userCount: userCount,
      hasDbUrl: !!process.env.DATABASE_URL
    });
    
  } catch (error: any) {
    console.error('Auth test error:', {
      message: error?.message,
      code: error?.code,
      name: error?.name
    });
    
    return NextResponse.json({
      status: 'error',
      error: error?.message || 'Unknown error',
      details: {
        code: error?.code,
        name: error?.name
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}