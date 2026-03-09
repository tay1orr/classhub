import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CLASS_CONFIG } from '@/lib/config'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const isAdmin = (CLASS_CONFIG.adminEmails as readonly string[]).includes(email)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        isApproved: isAdmin,
      },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    })

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? '관리자 계정으로 가입되었습니다. 바로 로그인하실 수 있습니다.'
        : '회원가입 완료! 관리자 승인 후 로그인할 수 있습니다.',
      needsApproval: !isAdmin,
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
