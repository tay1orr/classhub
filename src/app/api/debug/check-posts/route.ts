import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    // Check all posts directly
    const allPosts = await prisma.post.findMany();
    console.log('Debug: All posts count:', allPosts.length);
    
    // Check all boards
    const allBoards = await prisma.board.findMany();
    console.log('Debug: All boards:', allBoards);
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    console.log('Debug: All users:', allUsers.length);
    
    // Check all classrooms
    const allClassrooms = await prisma.classroom.findMany();
    console.log('Debug: All classrooms:', allClassrooms);

    return NextResponse.json({
      posts: allPosts,
      boards: allBoards,
      users: allUsers,
      classrooms: allClassrooms
    });

  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}