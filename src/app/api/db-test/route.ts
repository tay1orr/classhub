import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || process.env.database_url;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

export async function GET() {
  try {
    console.log('DB Test: Starting...');
    console.log('Database URL available:', !!databaseUrl);
    
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
      dbUrl: !!databaseUrl,
      queryResult: result,
      tables: tables
    });
  } catch (error) {
    console.error('DB Test Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error.message,
      code: error.code,
      name: error.name
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}