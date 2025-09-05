import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('API: Starting posts fetch...');
    
    // 먼저 연결 테스트
    await prisma.$connect();
    console.log('API: Database connected successfully');
    
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            name: true,
            id: true
          }
        },
        board: true,
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('API: Found posts:', posts.length);

    const postsWithCounts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.name,
      authorId: post.author.id,
      board: post.board.key.toLowerCase(),
      boardName: post.board.name,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      views: post.views,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.length
    }));

    return NextResponse.json({ posts: postsWithCounts });
  } catch (error: any) {
    console.error('API Error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'No code',
      meta: error?.meta || 'No meta',
      name: error?.name || 'Unknown'
    });
    return NextResponse.json({ 
      error: 'Failed to fetch posts',
      details: error?.message || 'Unknown error',
      code: error?.code || 'No code'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}