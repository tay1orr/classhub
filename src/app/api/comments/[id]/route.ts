import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 댓글 정보 확인
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        parentId: true
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 권한 확인: 작성자이거나 관리자여야 함
    const isAdmin = user.email === 'admin@classhub.co.kr';
    const isAuthor = comment.authorId === userId;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the author or admin can delete this comment' },
        { status: 403 }
      );
    }

    // 대댓글이 있는 경우 먼저 삭제
    await prisma.comment.deleteMany({
      where: { parentId: commentId }
    });

    // 댓글 삭제
    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment: ' + error.message },
      { status: 500 }
    );
  }
}