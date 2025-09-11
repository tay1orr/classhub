import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel serverless 캐시 무효화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🗑️ 댓글 삭제 API 호출:', { commentId: params.id, timestamp: new Date().toISOString() });
  
  try {
    const commentId = params.id;
    
    // Body가 없을 수도 있으니 안전하게 처리
    let userId = null;
    try {
      const body = await request.json();
      userId = body.userId;
    } catch (e) {
      console.log('📋 Request body 없음 - URL에서 사용자 정보 확인 필요');
    }

    if (!userId) {
      console.error('❌ User ID가 제공되지 않음');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 댓글 검색 중:', { commentId, userId });

    // 댓글 정보 확인
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        parentId: true,
        content: true
      }
    });

    console.log('📋 댓글 조회 결과:', comment);

    if (!comment) {
      console.error('❌ 댓글을 찾을 수 없음:', commentId);
      
      // 댓글이 이미 삭제되었다면 성공으로 처리 (중복 삭제 방지)
      console.log('💡 댓글이 이미 삭제되었거나 존재하지 않음 - 성공으로 처리');
      return NextResponse.json(
        { 
          success: true,
          message: 'Comment already deleted or does not exist'
        },
        { status: 200 }
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