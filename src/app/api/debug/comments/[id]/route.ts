import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get post with comment count
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        comments: true
      }
    });

    // Get all comments for this post from database
    const dbComments = await prisma.comment.findMany({
      where: { postId },
      include: {
        replies: true
      }
    });

    // Count total comments + replies from database
    let dbTotalCount = dbComments.length;
    dbComments.forEach(comment => {
      dbTotalCount += comment.replies.length;
    });

    // Simulate localStorage data (this would vary by user)
    // For debug, we'll show what localStorage might contain
    const sampleLocalStorageComments = `comments_${postId}`;
    const sampleLocalStorageReplies = `replies_${postId}`;

    return NextResponse.json({
      post,
      database: {
        comments: dbComments,
        totalComments: dbComments.length,
        totalWithReplies: dbTotalCount
      },
      localStorageKeys: {
        comments: sampleLocalStorageComments,
        replies: sampleLocalStorageReplies
      },
      analysis: {
        postCommentsField: post?.comments || 0,
        actualDbComments: dbTotalCount,
        mismatch: (post?.comments || 0) !== dbTotalCount
      }
    });

  } catch (error: any) {
    console.error('Debug comments error:', error);
    return NextResponse.json(
      { error: 'Failed to debug comments', details: error.message },
      { status: 500 }
    );
  }
}