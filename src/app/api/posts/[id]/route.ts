import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0&client_encoding=utf8'
      }
    }
  });

  try {
    const postId = params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        board: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: {
        views: { increment: 1 }
      }
    });

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.name,
      authorId: post.author.id,
      board: post.board.key.toLowerCase(),
      boardName: post.board.name,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      views: post.views + 1, // Include the increment
      likes: post.likesCount,
      dislikes: post.dislikesCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: comment.author.name,
        authorId: comment.author.id,
        isAnonymous: comment.isAnonymous,
        createdAt: comment.createdAt.toISOString(),
        likes: comment.likesCount || 0
      }))
    };

    return NextResponse.json({ post: formattedPost });

  } catch (error: any) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}