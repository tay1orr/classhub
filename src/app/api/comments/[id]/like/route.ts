import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;
    const body = await request.text();
    const { userId } = JSON.parse(body);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    if (existingLike) {
      // 좋아요 취소
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        }
      });

      // 댓글의 좋아요 수 감소
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likesCount: { decrement: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        liked: false,
        message: 'Comment like removed'
      });
    } else {
      // 좋아요 추가
      await prisma.commentLike.create({
        data: {
          userId,
          commentId
        }
      });

      // 댓글의 좋아요 수 증가
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          likesCount: { increment: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likesCount: updatedComment.likesCount,
        message: 'Comment liked'
      });
    }

  } catch (error: any) {
    console.error('Comment like error:', error);
    return NextResponse.json(
      { error: 'Failed to like comment: ' + error.message },
      { status: 500 }
    );
  }
}