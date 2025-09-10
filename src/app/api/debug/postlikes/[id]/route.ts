import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get all likes for this post
    const postLikes = await prisma.postLike.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get post info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        likesCount: true,
        dislikesCount: true
      }
    });

    // Count likes and dislikes
    const actualLikes = postLikes.filter(like => like.isLike === true).length;
    const actualDislikes = postLikes.filter(like => like.isLike === false).length;

    return NextResponse.json({
      post,
      actualCounts: {
        likes: actualLikes,
        dislikes: actualDislikes
      },
      postLikes,
      totalLikeRecords: postLikes.length
    });

  } catch (error: any) {
    console.error('Debug postlikes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post likes debug info' },
      { status: 500 }
    );
  }
}