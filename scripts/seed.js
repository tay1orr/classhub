const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 데이터베이스 시딩 시작...');

  // 기본 게시판 생성
  const freeBoard = await prisma.board.upsert({
    where: { key: 'FREE' },
    update: {},
    create: {
      key: 'FREE',
      name: '자유게시판'
    }
  });

  const assignmentBoard = await prisma.board.upsert({
    where: { key: 'ASSIGNMENT' },
    update: {},
    create: {
      key: 'ASSIGNMENT',
      name: '수행평가'
    }
  });

  const examBoard = await prisma.board.upsert({
    where: { key: 'EXAM' },
    update: {},
    create: {
      key: 'EXAM',
      name: '지필평가'
    }
  });

  // 1-8 교실 생성
  const classroom = await prisma.classroom.upsert({
    where: { grade_classNo: { grade: 1, classNo: 8 } },
    update: {},
    create: {
      grade: 1,
      classNo: 8,
      name: '1학년 8반'
    }
  });

  // 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@classhub.co.kr' },
    update: {},
    create: {
      email: 'admin@classhub.co.kr',
      name: '관리자',
      passwordHash: hashedPassword,
      role: 'ADMIN'
    }
  });

  // 관리자를 1-8반에 추가
  await prisma.userClassroom.upsert({
    where: {
      userId_classroomId: {
        userId: adminUser.id,
        classroomId: classroom.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      classroomId: classroom.id
    }
  });

  // 샘플 게시글 생성
  await prisma.post.create({
    data: {
      title: '🎉 우리반 커뮤니티에 오신 것을 환영합니다!',
      content: '안녕하세요 여러분! \n\n1학년 8반만의 특별한 소통 공간이 만들어졌어요. \n여기서 자유롭게 이야기하고, 과제 정보도 공유하고, 시험 자료도 함께 나눠요! \n\n궁금한 것이 있으면 언제든 글을 올려주세요 😊',
      boardId: freeBoard.id,
      classroomId: classroom.id,
      authorId: adminUser.id,
      isPinned: true
    }
  });

  console.log('✅ 데이터베이스 시딩 완료!');
  console.log('📧 관리자 계정: admin@classhub.co.kr / admin123!');
}

main()
  .catch((e) => {
    console.error('❌ 시딩 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });