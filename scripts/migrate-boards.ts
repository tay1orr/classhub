import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateBoardNames() {
  console.log('🚀 Starting board migration...')
  
  try {
    // 1. Update Board table
    console.log('📋 Updating Board table...')
    
    // Update ASSIGNMENT → EVALUATION
    const assignmentBoard = await prisma.board.findUnique({
      where: { key: 'ASSIGNMENT' }
    })
    
    if (assignmentBoard) {
      await prisma.board.update({
        where: { key: 'ASSIGNMENT' },
        data: {
          key: 'EVALUATION',
          name: '수행/지필평가'
        }
      })
      console.log('✅ ASSIGNMENT → EVALUATION updated')
    }
    
    // Update EXAM → SUGGESTION  
    const examBoard = await prisma.board.findUnique({
      where: { key: 'EXAM' }
    })
    
    if (examBoard) {
      await prisma.board.update({
        where: { key: 'EXAM' },
        data: {
          key: 'SUGGESTION',
          name: '건의사항'
        }
      })
      console.log('✅ EXAM → SUGGESTION updated')
    }
    
    // 2. Update all posts that reference old board keys
    console.log('📝 Updating posts...')
    
    // Update posts with assignment board
    const assignmentPosts = await prisma.post.updateMany({
      where: {
        board: {
          key: 'ASSIGNMENT'
        }
      },
      data: {
        // Posts will automatically reference the updated board
      }
    })
    
    // Update posts with exam board
    const examPosts = await prisma.post.updateMany({
      where: {
        board: {
          key: 'EXAM'  
        }
      },
      data: {
        // Posts will automatically reference the updated board
      }
    })
    
    console.log(`✅ Updated ${assignmentPosts.count} assignment posts`)
    console.log(`✅ Updated ${examPosts.count} exam posts`)
    
    // 3. Show final status
    const boards = await prisma.board.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    })
    
    console.log('\n📊 Final board status:')
    boards.forEach(board => {
      console.log(`- ${board.key}: "${board.name}" (${board._count.posts} posts)`)
    })
    
    console.log('\n✅ Board migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateBoardNames()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })