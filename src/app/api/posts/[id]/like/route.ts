import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const { isLike } = await request.json(); // true for like, false for dislike
    const postId = params.id;
    
    // For now, we'll use a simple approach without user authentication
    // In a real app, you'd get userId from session
    const tempUserId = `temp_${Date.now()}_${Math.random()}`;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // For now, we'll just update the post counters directly
    // In the enhanced schema, we would track individual likes
    if (isLike) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          views: { increment: 1 } // Using views field temporarily for likes
        }
      });
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        views: true,
        // likesCount: true,    // Will be available after schema migration
        // dislikesCount: true  // Will be available after schema migration
      }
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
      likes: updatedPost?.views || 0,
      dislikes: 0
    });

  } catch (error: any) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}