import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 기본 데이터만 생성 (복잡한 관계 테이블은 제외)
  
  // 사용자 생성
  const hashedPassword = await bcrypt.hash('admin123!', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@classhub.co.kr' },
    update: {},
    create: {
      email: 'admin@classhub.co.kr',
      name: '관리자',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ 관리자 사용자 생성 완료')

  // 학급 생성
  const classroom = await prisma.classroom.upsert({
    where: { grade_classNo: { grade: 1, classNo: 8 } },
    update: {},
    create: {
      grade: 1,
      classNo: 8,
      name: '1학년 8반',
    },
  })

  console.log('✅ 학급 생성 완료')

  // 게시판 생성
  const boards = await Promise.all([
    prisma.board.upsert({
      where: { key: 'FREE' },
      update: {},
      create: { key: 'FREE', name: '자유게시판' },
    }),
    prisma.board.upsert({
      where: { key: 'ASSIGNMENT' },
      update: {},
      create: { key: 'ASSIGNMENT', name: '수행평가' },
    }),
    prisma.board.upsert({
      where: { key: 'EXAM' },
      update: {},
      create: { key: 'EXAM', name: '지필평가' },
    }),
  ])

  console.log('✅ 게시판 생성 완료')

  // 관리자를 학급에 추가
  await prisma.userClassroom.upsert({
    where: {
      userId_classroomId: {
        userId: admin.id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      classroomId: classroom.id,
    },
  })

  // 환영 게시글 생성
  await prisma.post.upsert({
    where: { id: 'welcome_post' },
    update: {},
    create: {
      id: 'welcome_post',
      boardId: boards[0].id, // 자유게시판
      classroomId: classroom.id,
      authorId: admin.id,
      title: '🎉 우리반 커뮤니티에 오신 것을 환영합니다!',
      content: `안녕하세요 여러분! 

1학년 8반만의 특별한 소통 공간이 만들어졌어요. 
여기서 자유롭게 이야기하고, 과제 정보도 공유하고, 시험 자료도 함께 나눠요! 

궁금한 것이 있으면 언제든 글을 올려주세요 😊`,
      isPinned: true,
    },
  })

  console.log('✅ 환영 게시글 생성 완료')

  console.log('🎉 시드 데이터 생성 완료!')
  console.log('\n📋 테스트 계정 정보:')
  console.log('관리자: admin@classhub.co.kr / admin123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })