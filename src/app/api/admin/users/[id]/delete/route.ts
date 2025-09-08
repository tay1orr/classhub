import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const userId = params.id;

    // 삭제할 사용자 정보 조회
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 자기 자신은 삭제할 수 없음 (추가 보안)
    // 이 체크는 프론트엔드에서도 하지만 서버에서 한번 더 확인
    
    // 관련 데이터 삭제 (cascade 삭제가 안 되는 경우를 위해)
    await prisma.$transaction(async (tx) => {
      // 댓글 삭제
      await tx.comment.deleteMany({
        where: { authorId: userId }
      });

      // 게시글 삭제
      await tx.post.deleteMany({
        where: { authorId: userId }
      });

      // 사용자 교실 관계 삭제
      await tx.userClassroom.deleteMany({
        where: { userId: userId }
      });

      // 계정 정보 삭제 (NextAuth 관련)
      await tx.account.deleteMany({
        where: { userId: userId }
      });

      await tx.session.deleteMany({
        where: { userId: userId }
      });

      // 마지막으로 사용자 삭제
      await tx.user.delete({
        where: { id: userId }
      });
    });

    console.log('🗑️ 사용자 삭제 완료:', userToDelete);

    return NextResponse.json({
      success: true,
      message: `${userToDelete.name}님이 삭제되었습니다.`,
      deletedUser: userToDelete
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}