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
    const { userId, isLike } = await request.json(); // true for like, false for dislike
    const postId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    // Check if user already liked/disliked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId
        }
      }
    });

    if (existingLike) {
      if (existingLike.isLike === isLike) {
        // Same action - remove the like/dislike
        await prisma.$transaction([
          prisma.postLike.delete({
            where: { id: existingLike.id }
          }),
          prisma.post.update({
            where: { id: postId },
            data: isLike 
              ? { likesCount: { decrement: 1 } }
              : { dislikesCount: { decrement: 1 } }
          })
        ]);
      } else {
        // Different action - update the like/dislike
        await prisma.$transaction([
          prisma.postLike.update({
            where: { id: existingLike.id },
            data: { isLike }
          }),
          prisma.post.update({
            where: { id: postId },
            data: isLike
              ? { likesCount: { increment: 1 }, dislikesCount: { decrement: 1 } }
              : { likesCount: { decrement: 1 }, dislikesCount: { increment: 1 } }
          })
        ]);
      }
    } else {
      // New like/dislike
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            userId,
            postId,
            isLike
          }
        }),
        prisma.post.update({
          where: { id: postId },
          data: isLike
            ? { likesCount: { increment: 1 } }
            : { dislikesCount: { increment: 1 } }
        })
      ]);
    }

    // Get updated post with counts
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        likesCount: true,
        dislikesCount: true,
        likes: {
          where: { userId },
          select: { isLike: true }
        }
      }
    });

    const userCurrentLike = updatedPost?.likes[0]?.isLike
    
    return NextResponse.json({
      success: true,
      likes: updatedPost?.likesCount || 0,
      dislikes: updatedPost?.dislikesCount || 0,
      userLike: userCurrentLike === true ? true : userCurrentLike === false ? false : null
    });

  } catch (error: any) {
    console.error('Like post error:', error);
    
    // 더 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to like post'
    if (error.code === 'P2002') {
      errorMessage = 'Duplicate like action detected'
    } else if (error.code === 'P2025') {
      errorMessage = 'Post or user not found'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timeout - please try again'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma disconnect error:', disconnectError);
    }
  }
}