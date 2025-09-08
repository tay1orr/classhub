import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isApproved: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 승인 상태 확인
    if (!user.isApproved) {
      return NextResponse.json(
        { error: '아직 관리자 승인이 완료되지 않았습니다. 승인 후 다시 로그인해주세요.' },
        { status: 403 }
      );
    }

    // 비밀번호 해시 제거한 사용자 정보 반환
    const { passwordHash, ...userWithoutPassword } = user;

    console.log('✅ 로그인 성공:', userWithoutPassword);

    return NextResponse.json({
      success: true,
      message: '로그인 성공!',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}