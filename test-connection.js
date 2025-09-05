// SQLite 데이터베이스 연결 테스트
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    // todos 테이블에서 데이터 조회
    const todos = await prisma.todo.findMany({ take: 1 })
    console.log('✅ SQLite 데이터베이스 연결 성공!')
    console.log('Todos:', todos)

    // users 테이블 확인
    const users = await prisma.user.findMany({ take: 1 })
    console.log('Users:', users.length, '명')

    // boards 테이블 확인
    const boards = await prisma.board.findMany()
    console.log('Boards:', boards.map(b => b.name))

  } catch (err) {
    console.log('❌ 연결 오류:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()