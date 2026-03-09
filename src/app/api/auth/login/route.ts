export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/auth-server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, role: true, isApproved: true },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    if (!user.isApproved) {
      return NextResponse.json({ error: '아직 관리자 승인이 완료되지 않았습니다. 승인 후 로그인해 주세요.' }, { status: 403 })
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved }
    await setSessionCookie(sessionUser)

    return NextResponse.json({ success: true, user: sessionUser })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
