export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const SECRET_TOKEN = 'classhub-setup-2026'

export async function POST(request: Request) {
  const { token } = await request.json()
  if (token !== SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = 'taylorr@gclass.ice.go.kr'
  const password = 'dbsdk4fkd!'
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', isApproved: true, name: '관리자' },
    create: { name: '관리자', email, passwordHash, role: 'ADMIN', isApproved: true },
    select: { id: true, name: true, email: true, role: true, isApproved: true },
  })

  return NextResponse.json({ success: true, user })
}
