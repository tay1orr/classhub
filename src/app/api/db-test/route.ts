import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('DB Test: Starting...');
    
    // 연결 테스트
    await prisma.$connect();
    console.log('DB Test: Connected successfully');
    
    // 간단한 쿼리 테스트
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('DB Test: Query result:', result);
    
    // 테이블 존재 확인
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('DB Test: Tables found:', tables);
    
    return NextResponse.json({ 
      status: 'success',
      queryResult: result,
      tables: tables
    });
  } catch (error: any) {
    console.error('DB Test Error:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'No code',
      meta: error?.meta || 'No meta',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack'
    });
    
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error?.message || 'Unknown error',
      code: error?.code || 'No code',
      name: error?.name || 'Unknown'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}