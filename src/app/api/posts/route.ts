import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DATABASE_URL 환경변수 처리
const databaseUrl = process.env.DATABASE_URL || process.env.database_url;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}