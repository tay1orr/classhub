import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Basic Test: Starting...');
    
    // 가장 기본적인 연결만 테스트
    await prisma.$connect();
    console.log('Basic Test: Connected successfully');
    
    // raw query 대신 Prisma model 사용
    const userCount = await prisma.user.count();
    console.log('Basic Test: User count:', userCount);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection working',
      userCount: userCount
    });
  } catch (error: any) {
    console.error('Basic Test Error:', {
      message: error?.message,
      code: error?.code,
      name: error?.name
    });
    
    return NextResponse.json({ 
      error: 'Basic test failed',
      details: error?.message || 'Unknown error',
      code: error?.code || 'No code'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}