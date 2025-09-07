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
    const { name, email, password } = await request.json();

    // 입력 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // 특정 이메일들은 자동으로 관리자 권한 부여
    const adminEmails = [
      'taylorr@glcass.ice.go.kr',
      'admin@classhub.co.kr',
      'taylorr@naver.com'  // 사용자 이메일 추가
    ];
    const isSpecialAdmin = adminEmails.includes(email);
    
    // 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isSpecialAdmin ? 'ADMIN' : 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // 기본 교실에 추가 (1학년 8반)
    await prisma.userClassroom.create({
      data: {
        userId: newUser.id,
        classroomId: 'classroom_1_8'
      }
    });

    console.log('✅ 새 사용자 등록:', newUser);
    
    return NextResponse.json({
      success: true,
      message: isSpecialAdmin ? 
        '회원가입이 완료되었습니다! 관리자 권한이 자동으로 부여되었습니다. 🎉' : 
        '회원가입이 완료되었습니다!',
      user: newUser
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}