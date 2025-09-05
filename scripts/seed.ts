import { PrismaClient, Role, BoardType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 기존 데이터 정리
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.report.deleteMany()
  await prisma.vote.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.board.deleteMany()
  await prisma.userClassroom.deleteMany()
  await prisma.classroom.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // 사용자 생성
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@classhub.kr',
      name: '김교사',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  })

  const mod = await prisma.user.create({
    data: {
      email: 'mod@classhub.kr',
      name: '박부장',
      passwordHash: hashedPassword,
      role: Role.MOD,
    },
  })

  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student1@classhub.kr',
        name: '이학생',
        passwordHash: hashedPassword,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student2@classhub.kr',
        name: '최학생',
        passwordHash: hashedPassword,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student3@classhub.kr',
        name: '정학생',
        passwordHash: hashedPassword,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student4@classhub.kr',
        name: '강학생',
        passwordHash: hashedPassword,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student5@classhub.kr',
        name: '윤학생',
        passwordHash: hashedPassword,
        role: Role.STUDENT,
      },
    }),
  ])

  console.log('✅ 사용자 생성 완료')

  // 학급 생성
  const classroom1 = await prisma.classroom.create({
    data: {
      grade: 1,
      classNo: 6,
      name: '1-6',
    },
  })

  const classroom2 = await prisma.classroom.create({
    data: {
      grade: 1,
      classNo: 7,
      name: '1-7',
    },
  })

  console.log('✅ 학급 생성 완료')

  // 사용자-학급 매핑
  await Promise.all([
    prisma.userClassroom.create({
      data: { userId: admin.id, classroomId: classroom1.id },
    }),
    prisma.userClassroom.create({
      data: { userId: admin.id, classroomId: classroom2.id },
    }),
    prisma.userClassroom.create({
      data: { userId: mod.id, classroomId: classroom1.id },
    }),
    ...students.slice(0, 3).map(student =>
      prisma.userClassroom.create({
        data: { userId: student.id, classroomId: classroom1.id },
      })
    ),
    ...students.slice(3).map(student =>
      prisma.userClassroom.create({
        data: { userId: student.id, classroomId: classroom2.id },
      })
    ),
  ])

  console.log('✅ 사용자-학급 매핑 완료')

  // 게시판 생성
  const boards = await Promise.all([
    prisma.board.create({
      data: { key: BoardType.FREE, name: '자유게시판' },
    }),
    prisma.board.create({
      data: { key: BoardType.ASSIGNMENT, name: '수행평가' },
    }),
    prisma.board.create({
      data: { key: BoardType.EXAM, name: '지필평가' },
    }),
  ])

  console.log('✅ 게시판 생성 완료')

  // 태그 생성
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: '공지' } }),
    prisma.tag.create({ data: { name: '질문' } }),
    prisma.tag.create({ data: { name: '정보' } }),
    prisma.tag.create({ data: { name: '국어' } }),
    prisma.tag.create({ data: { name: '수학' } }),
    prisma.tag.create({ data: { name: '영어' } }),
  ])

  console.log('✅ 태그 생성 완료')

  // 게시글 생성
  const posts = []
  
  for (const board of boards) {
    for (const classroom of [classroom1, classroom2]) {
      // 공지글 1개
      const pinnedPost = await prisma.post.create({
        data: {
          boardId: board.id,
          classroomId: classroom.id,
          authorId: admin.id,
          title: `${board.name} 공지사항`,
          content: `${classroom.name} ${board.name}의 중요한 공지사항입니다.\n\n규칙을 준수하여 사용해주세요.`,
          isPinned: true,
          views: Math.floor(Math.random() * 100) + 50,
        },
      })
      posts.push(pinnedPost)

      // 일반글 4개
      for (let i = 0; i < 4; i++) {
        const randomStudent = students[Math.floor(Math.random() * students.length)]
        const post = await prisma.post.create({
          data: {
            boardId: board.id,
            classroomId: classroom.id,
            authorId: randomStudent.id,
            title: `${board.name} 게시글 ${i + 1}`,
            content: `${board.name}에 대한 내용입니다.\n\n도움이 되었으면 좋겠네요!`,
            isAnonymous: Math.random() > 0.5,
            views: Math.floor(Math.random() * 50),
          },
        })
        posts.push(post)

        // 태그 연결 (랜덤)
        const randomTag = tags[Math.floor(Math.random() * tags.length)]
        await prisma.postTag.create({
          data: { postId: post.id, tagId: randomTag.id },
        })
      }
    }
  }

  console.log('✅ 게시글 생성 완료')

  // 댓글 생성
  for (const post of posts) {
    const commentCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < commentCount; i++) {
      const randomStudent = students[Math.floor(Math.random() * students.length)]
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: randomStudent.id,
          content: `좋은 글이네요! 댓글 ${i + 1}`,
          isAnonymous: Math.random() > 0.7,
        },
      })
    }
  }

  console.log('✅ 댓글 생성 완료')

  // 투표 생성
  for (const post of posts) {
    const voterCount = Math.floor(Math.random() * 3) + 1
    const voters = students.slice(0, voterCount)
    
    for (const voter of voters) {
      await prisma.vote.create({
        data: {
          postId: post.id,
          userId: voter.id,
          value: Math.random() > 0.3 ? 1 : -1,
        },
      })
    }
  }

  console.log('✅ 투표 생성 완료')

  // 신고 생성
  const samplePosts = posts.slice(0, 3)
  for (const post of samplePosts) {
    await prisma.report.create({
      data: {
        targetType: 'POST',
        targetId: post.id,
        reporterId: students[0].id,
        reason: '부적절한 내용',
        detail: '게시글 내용이 부적절합니다.',
      },
    })
  }

  console.log('✅ 신고 생성 완료')

  // 알림 생성
  for (const student of students.slice(0, 2)) {
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: student.id,
          type: 'NEW_COMMENT',
          meta: { postId: posts[0].id, commentId: 'sample' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: student.id,
          type: 'POST_LIKED',
          meta: { postId: posts[1].id },
          isRead: true,
        },
      }),
    ])
  }

  console.log('✅ 알림 생성 완료')

  console.log('🎉 시드 데이터 생성 완료!')
  console.log('\n📋 테스트 계정 정보:')
  console.log('관리자: admin@classhub.kr / password123')
  console.log('모더레이터: mod@classhub.kr / password123')
  console.log('학생1: student1@classhub.kr / password123')
  console.log('학생2: student2@classhub.kr / password123')
  console.log('학생3: student3@classhub.kr / password123')
  console.log('학생4: student4@classhub.kr / password123')
  console.log('학생5: student5@classhub.kr / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })